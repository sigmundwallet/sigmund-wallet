import {
  BitcoinAddress,
  BitcoinTransaction,
  BitcoinTransactionSource,
  BlockchainType,
  KeyOwnerShipType,
  Prisma,
} from "@prisma/client";
import * as bitcoin from "bitcoinjs-lib";
import dayjs from "dayjs";
import type { PubSub } from "graphql-yoga";
import {
  ExcludesNullable,
  PubSubPublishArgs,
} from "modules/shared/utils/types";
import { prisma } from "../modules/shared/prisma";
import { BitcoinProvider } from "../modules/shared/providers/blockchain/BitcoinProvider";
import { AsyncTaskQueue } from "./AsyncTaskQueue";
import { BitcoinCore, Block } from "./bitcoin-core";
import * as zmq from "zeromq";
import { shorten } from "modules/shared/utils";
import axios from "axios";
import { Logger } from "pino";

export type NetworkName = keyof typeof bitcoin.networks;

const BITCOIN_CORE_HOST = process.env.BITCOIN_CORE_RPC_HOST;

export class BitcoinTracker {
  bitcoin: BitcoinProvider;
  taskQueue = new AsyncTaskQueue();
  bitcoinCore: BitcoinCore;
  network: bitcoin.networks.Network;

  processedMempoolTxHashes = new Set<string>();
  blockchainType: BlockchainType;
  logger: Logger;

  constructor(
    public pubSub: PubSub<PubSubPublishArgs>,
    public networkName: NetworkName,
    public options: {
      logger: Logger;
      monthlyPriceSats: number;
      trialPeriodDays: number;
      polling?: boolean;
    }
  ) {
    this.network = bitcoin.networks[networkName];
    this.blockchainType =
      networkName === "bitcoin"
        ? BlockchainType.Bitcoin
        : networkName === "testnet"
        ? BlockchainType.BitcoinTestnet
        : BlockchainType.BitcoinRegtest;
    this.logger = options.logger;

    this.bitcoin = new BitcoinProvider(this.network);
    this.bitcoinCore = new BitcoinCore();
  }

  async init() {
    this.logger.info("Initializing Bitcoin Tracker");
    this.logger.info(`Network: ${this.networkName}`);
    this.logger.info(`Monthly price: ${this.options.monthlyPriceSats} sats`);
    this.logger.info(`Trial period: ${this.options.trialPeriodDays} days`);
  }

  async start() {
    await this.processWallets();
    this.subscribeToWalletUpdates();
    this.subscribeToTxBroadcasts();

    this.updateBitcoinChainInfo();
    setInterval(() => {
      this.updateBitcoinChainInfo();
    }, 1000 * 60 * 2); // every 2 minutes

    this.signWithPlatformKey();
    setInterval(() => {
      this.updateBitcoinChainInfo();
    }, 1000 * 60 * 60); // every hour

    if (this.options.polling) {
      await this.blockLoop();

      setInterval(async () => {
        await this.blockLoop();
      }, 5000);

      this.logger.info("Bitcoin Tracker started in polling mode");
    } else {
      await this.blockLoop();

      this.startZmq();

      this.logger.info("Bitcoin Tracker started in ZMQ mode");

      this.logger.info("Checking if there are transactions to broadcast");
      const txsToBroadcast = await prisma.bitcoinTransaction.findMany({
        where: {
          source: BitcoinTransactionSource.APP,
          error: null,
        },
      });

      for (const tx of txsToBroadcast) {
        await this.broadcastTx(tx);
      }
    }
  }

  async startZmq() {
    const txQueueSocket = new zmq.Subscriber();

    txQueueSocket.connect(`tcp://${BITCOIN_CORE_HOST}:28333`);
    txQueueSocket.subscribe();
    txQueueSocket.events.on("connect", () => {
      this.logger.info("Connected to ZMQ");
    });
    txQueueSocket.events.on("disconnect", () => {
      this.logger.info("Disconnected from ZMQ");
    });

    for await (const [topicBuf, msgBuf] of txQueueSocket) {
      const topic = topicBuf.toString();
      switch (topic) {
        case "rawtx":
          await this.processTx(prisma, msgBuf.toString("hex"), null, null);
          break;
        case "hashblock":
          const blockHash = msgBuf.toString("hex");
          const block = await this.bitcoinCore.getBlock(blockHash, 2);
          await this.processBlock(block);
          break;
      }
    }
  }

  async blockLoop() {
    this.logger.info("Checking for new blocks");
    const { lastBlock } = await prisma.bitcoinChainInfo.findFirstOrThrow({
      where: {
        id: this.blockchainType,
      },
    });
    const currentHeight = await this.bitcoinCore.getBlockCount();
    this.logger.info(`Processed ${lastBlock}/${currentHeight} blocks`);

    if (lastBlock < currentHeight) {
      await this.syncBlocks(lastBlock + 1);
    }

    this.logger.info("Checking for new transactions in mempool");
    const mempool = await this.bitcoinCore.getRawMemPool();

    this.logger.info(`There are ${mempool.length} transactions in mempool`);

    for (const txId of mempool) {
      if (this.processedMempoolTxHashes.has(txId)) {
        continue;
      }
      const hex = await this.bitcoinCore.getRawTransaction(txId);

      await prisma.$transaction(async ($prisma) => {
        await this.processTx($prisma, hex, null, null);
      });
    }
  }

  async syncBlocks(startFrom: number) {
    const currentHeight = await this.bitcoinCore.getBlockCount();
    for (let i = startFrom; i <= currentHeight; i++) {
      const blockHash = await this.bitcoinCore.getBlockHash(i);
      const block = await this.bitcoinCore.getBlock(blockHash, 2);
      await this.processBlock(block);
    }
  }

  /*
    The algorithm to process a block is as follows:
    1. Get all transactions in the block
    2. For each transaction, get all addresses that are involved in the outputs
    3. Check if addresses are in the database
    4. If they are, create a new transaction record
    5. Also create a new transaction output record for each output
    6. For each input check if tx hash is in the database
    7. If it is, update the transaction output record to point to the new transaction
  */
  async processBlock({ height, tx, time }: Block<2>) {
    this.logger.info("Processing block " + height);
    await prisma.$transaction(
      async ($prisma) => {
        for (const { hex } of tx) {
          await this.processTx($prisma, hex, time, height);
        }
        await $prisma.bitcoinChainInfo.update({
          where: {
            id: this.blockchainType,
          },
          data: {
            lastBlock: height,
          },
        });
      },
      { timeout: 1000 * 30 }
    );
  }

  async processTx(
    $prisma: Prisma.TransactionClient,
    hex: string,
    time: number | null,
    height: number | null
  ) {
    const tx = bitcoin.Transaction.fromHex(hex);
    const txId = tx.getId();

    if (this.processedMempoolTxHashes.has(txId)) {
      this.logger.info("Skipping tx %s", txId);
      return;
    }

    this.logger.info("Processing transaction %s", txId);

    const bitcoinTransaction = await $prisma.bitcoinTransaction.findUnique({
      where: {
        txHash: txId,
      },
      include: {
        inputs: true,
        outputs: true,
      },
    });

    const blockTimestamp = time ? dayjs.unix(time).toDate() : null;

    let shouldCreateInputsAndOutputs = true;
    if (bitcoinTransaction) {
      this.logger.info("Tx already exists, updating height");
      if (
        bitcoinTransaction.inputs.length > 0 ||
        bitcoinTransaction.outputs.length > 0
      ) {
        shouldCreateInputsAndOutputs = false;
      }
      const result = await $prisma.bitcoinTransaction.update({
        where: {
          txHash: txId,
        },
        data: {
          height: height || null,
          blockTimestamp,
          txHash: txId,
          data: hex,
          locktime: tx.locktime,
          version: tx.version,
          source: height
            ? BitcoinTransactionSource.BLOCK
            : BitcoinTransactionSource.MEMPOOL,
        },
        select: {
          outputs: {
            select: {
              BitcoinAddress: {
                select: {
                  walletId: true,
                  accountIndex: true,
                  PlatformKey: {
                    select: {
                      keyId: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      for (const output of result.outputs) {
        if (output.BitcoinAddress) {
          if (output.BitcoinAddress.PlatformKey) {
            await this.processPlatformKeyBilling(
              $prisma,
              output.BitcoinAddress.PlatformKey.keyId
            );
          }
        }
      }

      result.outputs.forEach((output) => {
        // TODO batch wallet balance updates
        if (output.BitcoinAddress) {
          this.pubSub.publish(
            `account-balance/${output.BitcoinAddress.walletId}/${output.BitcoinAddress.accountIndex}`
          );
        }
      });
    } else {
      const adresses = tx.outs
        .map((out) => {
          try {
            return [
              bitcoin.address.fromOutputScript(out.script, this.network),
              out.value,
            ] as const;
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean as unknown as ExcludesNullable);

      const trackedAddresses = await $prisma.bitcoinAddress.findMany({
        where: {
          address: {
            in: adresses.map(([address]) => address),
          },
        },
        select: {
          address: true,
          id: true,
        },
      });

      if (trackedAddresses.length === 0) {
        // No tracked addresses, no need to process this tx after it's included in a block
        this.processedMempoolTxHashes.add(txId);
        return;
      }

      this.logger.info(
        "Found tracked addresses",
        trackedAddresses.map((a) => a.address)
      );

      this.logger.info("Tx does not exist, creating");
      const result = await $prisma.bitcoinTransaction.create({
        data: {
          txHash: txId,
          data: hex,
          height: height || null,
          blockTimestamp,
          locktime: tx.locktime,
          version: tx.version,
          source: height
            ? BitcoinTransactionSource.BLOCK
            : BitcoinTransactionSource.MEMPOOL,
        },
      });
      this.logger.info("Created tx %s", result.txHash);
    }

    if (shouldCreateInputsAndOutputs) {
      for (const { index: txPos, hash, sequence } of tx.ins) {
        const prevTxHash = hash.reverse().toString("hex");
        this.logger.info("Processing input %s", `${prevTxHash}:${txPos}`);

        const prevTx = await $prisma.bitcoinTransaction.findUnique({
          where: {
            txHash: prevTxHash,
          },
          include: {
            outputs: true,
          },
        });

        if (!prevTx) {
          this.logger.info("Previous tx does not exist, skipping");
          continue;
        }
        this.logger.info("Previous tx exists, creating input");

        for (const output of prevTx.outputs) {
          if (output.txPos === txPos) {
            await $prisma.bitcoinOutput.update({
              where: {
                txHash_txPos: {
                  txHash: prevTxHash,
                  txPos,
                },
              },
              data: {
                spentInTransaction: {
                  connect: {
                    txHash: txId,
                  },
                },
              },
            });
            this.logger.info(
              `Associated output ${prevTxHash}:${txPos} with tx ${txId}`
            );
          }
        }
      }

      for (const [index, output] of tx.outs.map((_, i) => [i, _] as const)) {
        const { scripthash, address = "" } = this.bitcoin.parseOutputScript(
          output.script
        );
        const result = await $prisma.bitcoinOutput.create({
          data: {
            value: output.value,
            txHash: txId,
            txPos: index,
            scriptPubKey: output.script.toString("hex"),
            scripthash,
            BitcoinAddress: {
              connectOrCreate: {
                where: {
                  address,
                },
                create: {
                  address,
                  derivationIndex: 0,
                  Account: {
                    connectOrCreate: {
                      where: {
                        walletId_index: {
                          walletId: "dummy",
                          index: 0,
                        },
                      },
                      create: {
                        name: "dummy",
                        index: 0,
                        wallet: {
                          connectOrCreate: {
                            where: {
                              id: "dummy",
                            },
                            create: {
                              id: "dummy",
                              type: this.blockchainType,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            BitcoinTransaction: {
              connect: {
                txHash: txId,
              },
            },
          },
          select: {
            txPos: true,
            BitcoinAddress: {
              select: {
                walletId: true,
                accountIndex: true,
              },
            },
          },
        });

        if (result.BitcoinAddress?.walletId) {
          this.pubSub.publish(
            `account-balance/${result.BitcoinAddress?.walletId}/${result.BitcoinAddress?.accountIndex}`
          );
        }
        this.logger.info("Created output %s", result.txPos);
      }
    }
  }

  async processWallets() {
    const wallets = await prisma.wallet.findMany({
      where: {
        keys: {
          every: {
            bitcoinKey: {
              isNot: null,
            },
          },
        },
      },
      select: {
        id: true,
        keys: {
          select: {
            bitcoinKey: {
              select: {
                privateKey: true,
                publicKey: true,
              },
            },
          },
        },
        Accounts: {
          select: {
            index: true,
          },
        },
      },
    });

    for (const wallet of wallets) {
      for (const account of wallet.Accounts) {
        this.logger.info(
          `Processing account ${shorten(wallet.id)}:${account.index}`
        );
        await this.processWallet(wallet, account);
      }
    }
  }

  async processWallet(
    wallet: {
      id: string;
      keys: {
        bitcoinKey: {
          publicKey: string;
          privateKey: string | null;
        } | null;
      }[];
    },
    account: { index: number }
  ) {
    const bitcoinKeys = wallet.keys
      .map((key) => key.bitcoinKey)
      .filter(Boolean as unknown as ExcludesNullable);

    if (bitcoinKeys.length !== 3) {
      this.logger.info("Wallet has wrong number of keys, skipping");
      return;
    }

    const unusedAddresses = await prisma.bitcoinAddress.findMany({
      where: {
        Account: {
          walletId: wallet.id,
          index: account.index,
        },
        outputs: {
          none: {},
        },
      },
      select: {
        address: true,
        change: true,
      },
    });

    await prisma.$transaction(async ($prisma) => {
      let hasUnused = false;
      let hasUnusedChange = false;

      for (const address of unusedAddresses) {
        if (address.change) {
          hasUnusedChange = true;
        } else {
          hasUnused = true;
        }
      }

      if (!hasUnused || !hasUnusedChange) {
        let creationPlan: [
          derivationIndexStart: number,
          minAmount: number,
          isChange: boolean
        ][] = [];
        const amountToCreate = unusedAddresses.length === 0 ? 20 : 1;
        if (!hasUnused) {
          const { derivationIndex } = (await $prisma.bitcoinAddress.findFirst({
            where: {
              walletId: wallet.id,
              accountIndex: account.index,
              change: false,
            },
            orderBy: {
              derivationIndex: "desc",
            },
            select: {
              derivationIndex: true,
            },
          })) ?? { derivationIndex: -1 };
          creationPlan.push([derivationIndex + 1, amountToCreate, false]);
        }
        if (!hasUnusedChange) {
          const { derivationIndex } = (await $prisma.bitcoinAddress.findFirst({
            where: {
              walletId: wallet.id,
              accountIndex: account.index,
              change: true,
            },
            orderBy: {
              derivationIndex: "desc",
            },
            select: {
              derivationIndex: true,
            },
          })) ?? { derivationIndex: -1 };
          creationPlan.push([derivationIndex + 1, amountToCreate, true]);
        }

        const toCreate: Omit<
          BitcoinAddress,
          "id" | "createdAt" | "updatedAt" | "label" | "platformKeyKeyId"
        >[] = [];

        let lastOneIsUsed = false;
        for (const [
          derivationIndexStart,
          minAmount,
          isChange,
        ] of creationPlan) {
          for (
            let i = derivationIndexStart;
            i < derivationIndexStart + minAmount || lastOneIsUsed;
            i++
          ) {
            const address = this.bitcoin.createMultisigAddress(
              bitcoinKeys.map((key) =>
                key.privateKey
                  ? this.bitcoin.deriveAccount(key.privateKey, account.index)
                  : key.publicKey
              ),
              i,
              isChange
            );
            if (address) {
              lastOneIsUsed = false;

              toCreate.push({
                address,
                change: isChange,
                derivationIndex: i,
                walletId: wallet.id,
                accountIndex: account.index,
                lastStatus: null,
                baseXpub: null,
              });
            }
          }
        }

        const result = await $prisma.bitcoinAddress.createMany({
          data: toCreate,
        });
        this.logger.info(`Created ${result.count} addresses`);
        for (const address of toCreate) {
          this.logger.info(
            `Created address ${address.address} (${
              address.change ? "1" : "0"
            }/${address.derivationIndex}), wallet ${shorten(
              address.walletId
            )}:${address.accountIndex}`
          );
        }
      }
    });

    this.pubSub.publish(`account-balance/${wallet.id}/${account.index}`);
  }

  async processPlatformKeyBilling(
    $prisma: Prisma.TransactionClient,
    keyId: string
  ) {
    const platformKey = await $prisma.platformKey.findUnique({
      where: {
        keyId,
      },
      select: {
        billingUpdatedAt: true,
        paidUntil: true,
        BitcoinAddresses: {
          select: {
            address: true,
          },
        },
      },
    });

    if (!platformKey) {
      this.logger.info(`Platform key ${keyId} not found`);
      return;
    }

    const outputs = await $prisma.bitcoinOutput.findMany({
      where: {
        BitcoinAddress: {
          address: {
            in: platformKey.BitcoinAddresses.map((address) => address.address),
          },
        },
        BitcoinTransaction: {
          AND: [
            {
              height: {
                not: null,
              },
              blockTimestamp: {
                gte: platformKey.billingUpdatedAt,
              },
            },
          ],
        },
      },
    });

    if (outputs.length === 0) {
      this.logger.info(`No billing outputs for platform key ${keyId}`);
      return;
    }

    const total = outputs.reduce(
      (acc, output) => acc + Number(output.value),
      0
    );

    this.logger.info(
      `Platform key ${keyId} has ${outputs.length} outputs worth ${total} satoshis`
    );

    const paymentDue = dayjs(platformKey.paidUntil).diff(dayjs(), "month");

    const monthlyPriceSatsWithDiscount =
      total >= 10 * (this.options.monthlyPriceSats * 0.8) && paymentDue >= -1
        ? this.options.monthlyPriceSats * 0.8
        : this.options.monthlyPriceSats;

    if (total > 0) {
      const monthPaid = Math.floor(total / monthlyPriceSatsWithDiscount);
      const updatedPaidUntil = dayjs(platformKey.paidUntil).add(
        monthPaid,
        "month"
      );

      await $prisma.platformKey.update({
        where: {
          keyId,
        },
        data: {
          paidUntil: updatedPaidUntil.toDate(),
          billingUpdatedAt: new Date(),
          PlatformKeyBilling: {
            create: {
              amountPaid: total,
              basePrice: this.options.monthlyPriceSats,
              discountPrice: monthlyPriceSatsWithDiscount,
              monthsPaid: monthPaid,
            },
          },
        },
      });

      this.logger.info(
        `Platform key ${keyId} paid for ${monthPaid} months, now paid until ${updatedPaidUntil.format(
          "YYYY-MM-DD"
        )}`
      );
    }
  }

  async subscribeToWalletUpdates() {
    const source = this.pubSub.subscribe("wallet-update");
    this.logger.info("Subscribed to wallet updates");
    for await (const walletId of source) {
      this.logger.info("Got wallet update %s", walletId);
      const wallet = await prisma.wallet.findUnique({
        where: {
          id: walletId,
        },
        select: {
          id: true,
          keys: {
            select: {
              bitcoinKey: {
                select: {
                  privateKey: true,
                  publicKey: true,
                },
              },
            },
          },
          Accounts: {
            select: {
              walletId: true,
              index: true,
            },
          },
        },
      });
      if (wallet) {
        for (const account of wallet.Accounts) {
          this.logger.info(
            `Processing account ${shorten(account.walletId)}:${account.index}`
          );
          await this.processWallet(wallet, account);
        }
      }
    }
  }

  async subscribeToTxBroadcasts() {
    const source = this.pubSub.subscribe("broadcast-tx");
    this.logger.info("Subscribed to tx broadcasts");
    for await (const txId of source) {
      this.logger.info("Got tx broadcast %s", txId);
      const tx = await prisma.bitcoinTransaction.findUnique({
        where: {
          txHash: txId,
        },
      });

      if (tx) {
        await this.broadcastTx(tx);
      }
    }
  }

  async broadcastTx(tx: BitcoinTransaction) {
    if (tx && tx.source === BitcoinTransactionSource.APP && !tx.error) {
      this.logger.info("Broadcasting tx %s", tx.txHash);
      try {
        await this.bitcoinCore.sendRawTransaction(tx.data);
      } catch (error) {
        const errorMessage = (error as Error)?.message ?? "Unknown error";
        this.logger.error(
          `Error broadcasting tx ${tx.txHash}, ${errorMessage}`
        );
        await prisma.bitcoinTransaction.update({
          where: {
            txHash: tx.txHash,
          },
          data: {
            error: errorMessage,
          },
        });
      }
    }
  }

  async updateBitcoinChainInfo() {
    const feeRates: number[] = [];
    for (const target of [1, 2, 3, 4, 5, 10, 25]) {
      const fee = 0.00001;
      feeRates.push(fee > 0 ? fee * 100000 : fee);
    }

    let usdPrice = 0;

    try {
      const result = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price",
        {
          params: {
            ids: "bitcoin",
            vs_currencies: "usd, eur",
          },
        }
      );
      usdPrice = result.data.bitcoin.usd;
    } catch (error) {
      this.logger.error(
        `Error getting bitcoin price ${(error as Error).message}`
      );
    }

    await prisma.bitcoinChainInfo.upsert({
      where: {
        id: this.blockchainType,
      },
      create: {
        id: this.blockchainType,
        feeRates,
        usdPrice,
      },
      update: {
        feeRates,
        usdPrice,
      },
    });

    this.pubSub.publish(`blockchain-info/${this.blockchainType}`);
  }

  async signWithPlatformKey() {
    const signRequests = await prisma.platformKeySignRequest.findMany({
      where: {
        signedAt: null,
        willSignAt: {
          lte: new Date(),
        },
        BitcoinPaymentRequest: {
          isNot: null,
        },
      },
      orderBy: {
        willSignAt: "asc",
      },
      select: {
        BitcoinPaymentRequest: {
          select: {
            id: true,
            originalPsbt: true,
            psbt: true,
          },
        },
        PlatformKey: {
          select: {
            Key: {
              select: {
                id: true,
                bitcoinKey: {
                  select: {
                    masterFingerprint: true,
                    privateKey: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (signRequests.length === 0) {
      this.logger.info("No sign requests to process");
      return;
    }

    for (const request of signRequests) {
      this.logger.info(
        `Signing PSBT with platform key, ${request.BitcoinPaymentRequest?.id}`
      );
      if (request.BitcoinPaymentRequest?.psbt) {
        if (!request.PlatformKey.Key.bitcoinKey?.privateKey) {
          throw new Error("Key can't be used to sign PSBT");
        }

        const signedPsbt = this.bitcoin.signPSBT({
          psbt: request.BitcoinPaymentRequest.psbt,
          privateKey: request.PlatformKey.Key.bitcoinKey.privateKey,
        });

        const { masterFingerprint, updatedPSBT } = this.bitcoin.validatePSBT({
          origPSBTEncoded: request.BitcoinPaymentRequest.originalPsbt,
          currentPSBTEncoded: request.BitcoinPaymentRequest.psbt,
          newPSBTEncoded: signedPsbt,
        });

        if (
          !masterFingerprint.find(
            (f) =>
              f.toLowerCase() ===
              request.PlatformKey.Key.bitcoinKey?.masterFingerprint.toLowerCase()
          )
        ) {
          throw new Error("Transaction was not signed by the correct key");
        }

        await prisma.bitcoinPaymentRequest.update({
          where: {
            id: request.BitcoinPaymentRequest.id,
          },
          data: {
            psbt: updatedPSBT,
            signedWithKeys: {
              connect: {
                id: request.PlatformKey.Key.id,
              },
              update: {
                where: {
                  id: request.PlatformKey.Key.id,
                },
                data: { lastVerifiedAt: new Date() },
              },
            },
            PlatformKeySignRequest: {
              update: {
                signedAt: new Date(),
              },
            },
          },
          select: {
            id: true,
          },
        });

        this.logger.info(
          `Signed with platform key ${request.PlatformKey.Key.bitcoinKey.masterFingerprint}`
        );
      }
    }
  }
}

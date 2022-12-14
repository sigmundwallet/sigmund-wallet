import { BitcoinTransactionSource } from "@prisma/client";
import dayjs from "dayjs";
import { ExcludesNullable } from "modules/shared/utils/types";
import { builder } from "../builder";
import { CoinSelectTarget } from "coinselect";
import coinselectSplit from "coinselect/split";
import { validateSessionSignatures } from "./utils";

builder.prismaObject("BitcoinPaymentRequest", {
  fields: (t) => ({
    id: t.exposeID("id"),
    address: t.exposeString("address"),
    amount: t.expose("amount", { type: "BigInt" }),
    fee: t.expose("fee", { type: "BigInt" }),
    memo: t.exposeString("memo", { nullable: true }),
    psbt: t.exposeString("psbt", { nullable: true }),
    account: t.relation("Account"),
    transaction: t.relation("BitcoinTransaction", { nullable: true }),
    signedWithKeys: t.relation("signedWithKeys"),
    signRequest: t.relation("PlatformKeySignRequest", {
      nullable: true,
    }),
  }),
});

builder.queryFields((t) => ({
  bitcoinPaymentRequest: t.prismaField({
    type: "BitcoinPaymentRequest",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, root, { id }, ctx) => {
      const paymentRequest =
        await ctx.prisma.bitcoinPaymentRequest.findUniqueOrThrow({
          ...query,
          where: {
            id,
          },
        });

      return paymentRequest;
    },
  }),
}));

builder.mutationFields((t) => ({
  createBitcoinPaymentRequest: t.prismaField({
    type: "BitcoinPaymentRequest",
    args: {
      walletId: t.arg.string({ required: true }),
      accountIndex: t.arg.int({ required: true }),
      address: t.arg.string({ required: true }),
      amount: t.arg({ type: "BigInt", required: true }),
      maxOut: t.arg.boolean(),
      feeRate: t.arg.float({ required: true }),
      memo: t.arg.string(),
    },
    resolve: async (
      query,
      root,
      {
        walletId,
        accountIndex,
        address,
        amount,
        maxOut,
        feeRate: feeRatePrecise,
        memo,
      },
      ctx
    ) => {
      const account = await ctx.prisma.account.findUnique({
        where: {
          walletId_index: {
            walletId,
            index: accountIndex,
          },
        },
        include: {
          wallet: {
            include: {
              keys: {
                where: {
                  bitcoinKey: {
                    isNot: null,
                  },
                },
                include: {
                  bitcoinKey: true,
                  platformKey: {
                    select: {
                      paidUntil: true,
                      BitcoinAddresses: {
                        select: {
                          address: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          bitcoinAddresses: {
            where: {
              outputs: {
                some: {
                  spentInTransaction: null,
                  BitcoinTransaction: {
                    height: {
                      not: null,
                    },
                  },
                },
              },
            },
            include: {
              outputs: {
                include: {
                  BitcoinTransaction: true,
                  spentInTransaction: true,
                },
              },
            },
          },
        },
      });

      if (!account) {
        throw new Error("Wallet does not exist");
      }

      await validateSessionSignatures(ctx, {
        walletId,
        threshold: 0,
      });

      const platformKeys = account.wallet.keys
        .map((key) => key.platformKey)
        .filter(Boolean as unknown as ExcludesNullable);

      const isBillingAddress = platformKeys
        .map((key) => key.BitcoinAddresses[0].address)
        .includes(address);

      if (
        !isBillingAddress &&
        platformKeys.some((key) => dayjs().isAfter(key.paidUntil))
      ) {
        throw new Error("Platform key is not paid");
      }

      const activePaymentRequest =
        await ctx.prisma.bitcoinPaymentRequest.findFirst({
          where: {
            walletId: account.walletId,
            accountIndex: account.index,
            BitcoinTransaction: {
              is: null,
            },
          },
        });

      if (activePaymentRequest) {
        throw new Error("You already have a payment request pending");
      }

      if (account.wallet.keys.length !== 3) {
        throw new Error("Wallet does not have 3 keys");
      }

      const keys = account.wallet.keys
        .map((key) => key.bitcoinKey)
        .filter(Boolean as unknown as ExcludesNullable);

      let feeRate = Math.round(feeRatePrecise);

      const utxos: (typeof account.bitcoinAddresses[number]["outputs"][number] & {
        derivationPath: string;
      })[] = [];
      for (const address of account.bitcoinAddresses) {
        for (const output of address.outputs) {
          if (output.spentInTransaction && !output.spentInTransaction.height) {
            continue;
          }
          utxos.push({
            ...output,
            derivationPath: `${address.change ? "1" : "0"}/${
              address.derivationIndex
            }`,
          });
        }
      }

      const changeAddress = await ctx.prisma.bitcoinAddress.findFirst({
        where: {
          walletId,
          change: true,
          outputs: {
            none: {},
          },
        },
        orderBy: {
          derivationIndex: "asc",
        },
      });

      if (!changeAddress) {
        throw new Error("No change address found");
      }

      const targets: (CoinSelectTarget & { derivationPath?: string })[] = [
        {
          address,
          script: {
            length: ctx.blockchain.bitcoin.getScriptLength(address),
          },
          ...(!maxOut && { value: Number(amount) }),
        },
      ];

      if (!maxOut) {
        targets.push({
          address: changeAddress.address,
          script: {
            length: ctx.blockchain.bitcoin.getScriptLength(
              changeAddress.address
            ),
          },
          derivationPath: `1/${changeAddress.derivationIndex}`,
        });
      }

      const { inputs, outputs, fee } = coinselectSplit(
        utxos.map((output) => ({
          txId: output.txHash,
          vout: output.txPos,
          value: Number(output.value),
          script: {
            length: Math.ceil(
              (8 +
                account.wallet.threshold * 74 +
                account.wallet.keys.length * 34) /
                4
            ),
          },
          txData: output.BitcoinTransaction?.data!,
          derivationPath: output.derivationPath,
        })),
        targets,
        feeRate
      );

      if (!inputs) {
        throw new Error("Not enough funds");
      }

      if (!outputs) {
        throw new Error("No outputs");
      }

      for (const output of outputs) {
        if (!output.value) {
          throw new Error("Output value is missing");
        }
      }

      const psbt = ctx.blockchain.bitcoin.generatePSBT({
        inputs,
        outputs: outputs as Required<typeof targets[number]>[],
        accountIndex,
        keys,
      });

      const paymentRequest = await ctx.prisma.bitcoinPaymentRequest.create({
        data: {
          address,
          amount,
          fee,
          memo,
          psbt,
          originalPsbt: psbt,
          isBillingAddress,
          Account: {
            connect: {
              walletId_index: {
                walletId,
                index: accountIndex,
              },
            },
          },
        },
        ...query,
      });

      return paymentRequest;
    },
  }),
  updateBitcoinPaymentRequest: t.prismaField({
    type: "BitcoinPaymentRequest",
    args: {
      id: t.arg.string({ required: true }),
      psbt: t.arg.string(),
      memo: t.arg.string(),
    },
    resolve: async (query, root, { id, psbt, memo }, ctx) => {
      const paymentRequest =
        await ctx.prisma.bitcoinPaymentRequest.findUniqueOrThrow({
          where: {
            id,
          },
          include: {
            Account: {
              include: {
                wallet: {
                  include: {
                    keys: {
                      where: {
                        bitcoinKey: {
                          isNot: null,
                        },
                      },
                      include: {
                        bitcoinKey: {
                          select: {
                            publicKey: true,
                            derivationPath: true,
                            masterFingerprint: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            signedWithKeys: {
              select: {
                id: true,
              },
            },
          },
        });

      await validateSessionSignatures(ctx, {
        walletId: paymentRequest.Account.walletId,
        threshold: 0,
      });

      if (psbt) {
        if (psbt === paymentRequest.psbt) {
          throw new Error("PSBT is the same");
        }

        const keys = paymentRequest.Account.wallet.keys
          .map((key) => key.bitcoinKey)
          .filter(Boolean as unknown as ExcludesNullable);

        if (keys.length !== 3) {
          throw new Error("Wallet does not have 3 keys");
        }

        const { masterFingerprint: addedKeysFingerprints, updatedPSBT } =
          ctx.blockchain.bitcoin.validatePSBT({
            origPSBTEncoded: paymentRequest.originalPsbt,
            currentPSBTEncoded: paymentRequest.psbt,
            newPSBTEncoded: psbt,
          });

        // TODO: explore if this can be done in a single query
        const existingKeySignatures = new Set(
          paymentRequest.signedWithKeys.map((key) => key.id)
        );

        const signedKeys = paymentRequest.Account.wallet.keys
          .filter((key) =>
            addedKeysFingerprints.some(
              (addedKey) =>
                addedKey.toLowerCase() ===
                key.bitcoinKey!.masterFingerprint.toLowerCase()
            )
          )
          .filter((key) => !existingKeySignatures.has(key.id));

        const updatedPaymentRequest =
          await ctx.prisma.bitcoinPaymentRequest.update({
            where: {
              id,
            },
            data: {
              psbt: updatedPSBT,
              signedWithKeys: {
                connect: signedKeys.map((key) => ({ id: key.id })),
                updateMany: signedKeys.map((key) => ({
                  where: { id: key.id },
                  data: { lastVerifiedAt: new Date() },
                })),
              },
            },
            ...query,
          });

        return updatedPaymentRequest;
      } else if (memo) {
        const updatedPaymentRequest =
          await ctx.prisma.bitcoinPaymentRequest.update({
            where: {
              id,
            },
            data: {
              memo,
            },
            ...query,
          });

        return updatedPaymentRequest;
      }

      return paymentRequest;
    },
  }),
  broadcastBitcoinPaymentRequest: t.prismaField({
    type: "BitcoinPaymentRequest",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, root, { id }, ctx) => {
      const paymentRequest =
        await ctx.prisma.bitcoinPaymentRequest.findUniqueOrThrow({
          where: {
            id,
          },
          include: {
            Account: {
              select: {
                walletId: true,
              },
            },
          },
        });

      await validateSessionSignatures(ctx, {
        walletId: paymentRequest.Account.walletId,
        threshold: 0,
      });

      const tx = await ctx.blockchain.bitcoin.extractTransaction(
        paymentRequest.psbt
      );

      const updatedPaymentRequest =
        await ctx.prisma.bitcoinPaymentRequest.update({
          where: {
            id,
          },
          data: {
            BitcoinTransaction: {
              create: {
                txHash: tx.getId(),
                data: tx.toHex(),
                locktime: tx.locktime,
                version: tx.version,
                source: BitcoinTransactionSource.APP,
                label: paymentRequest.memo,
              },
            },
          },
          ...query,
        });

      await ctx.pubSub.publish("broadcast-tx", tx.getId());

      return updatedPaymentRequest;
    },
  }),
  removeBitcoinPaymentRequest: t.field({
    type: "Boolean",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (root, { id }, ctx) => {
      const paymentRequest =
        await ctx.prisma.bitcoinPaymentRequest.findUniqueOrThrow({
          where: {
            id,
          },
          include: {
            Account: {
              select: {
                walletId: true,
              },
            },
          },
        });

      await validateSessionSignatures(ctx, {
        walletId: paymentRequest.Account.walletId,
        threshold: 0,
      });

      if (!paymentRequest) {
        throw new Error("Payment request not found");
      }

      await ctx.prisma.bitcoinPaymentRequest.delete({
        where: {
          id,
        },
      });

      return true;
    },
  }),
}));

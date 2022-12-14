import dotenv from "dotenv";
dotenv.config();

import { BlockchainType, PrismaClient } from "@prisma/client";
import { BitcoinCore } from "../bitcoin-tracker/bitcoin-core";

const prisma = new PrismaClient();
const bitcoinCore = new BitcoinCore();

async function main() {
  await prisma.wallet.upsert({
    where: { id: "dummy" },
    create: {
      id: "dummy",
      type: BlockchainType.Bitcoin,
      Accounts: {
        connectOrCreate: {
          where: {
            walletId_index: {
              walletId: "dummy",
              index: 0,
            },
          },
          create: {
            index: 0,
            name: "Dummy Main",
          },
        },
      },
    },
    update: {
      Accounts: {
        connectOrCreate: {
          where: {
            walletId_index: {
              walletId: "dummy",
              index: 0,
            },
          },
          create: {
            index: 0,
            name: "Dummy Main",
          },
        },
      },
    },
  });

  const networkName = process.env.NETWORK_NAME || "testnet";
  const blockchainType =
    networkName === "bitcoin"
      ? BlockchainType.Bitcoin
      : networkName === "testnet"
      ? BlockchainType.BitcoinTestnet
      : BlockchainType.BitcoinRegtest;
  const currentHeight = await bitcoinCore.getBlockCount();

  await prisma.bitcoinChainInfo.upsert({
    where: { id: blockchainType },
    create: {
      id: blockchainType,
      lastBlock: currentHeight,
    },
    update: {
      lastBlock: currentHeight,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

import { createRedisEventTarget } from "@graphql-yoga/redis-event-target";
import { networks } from "bitcoinjs-lib";
import { createPubSub } from "graphql-yoga";
import Redis from "ioredis";
import { prisma } from "../prisma";
import { BitcoinProvider } from "../providers/blockchain/BitcoinProvider";
import { EmailProvider } from "../providers/email/EmailProvider";
import { Session } from "../utils/session";
import { ExtractPromise, PubSubPublishArgs } from "../utils/types";

import "../../../bitcoin-tracker/run";

const bitcoinNetwork = process.env.BITCOIN_NETWORK ?? "regtest";
const redisPort = Number(process.env.REDIS_PORT ?? 6379);
const redisHost = process.env.REDIS_HOST ?? "localhost";

export async function createContext(ctx: { session: Session }) {
  const bitcoin = new BitcoinProvider(
    networks[bitcoinNetwork as keyof typeof networks]
  );
  const email = new EmailProvider({
    appName:
      bitcoinNetwork.toLowerCase() === "mainnet"
        ? "Sigmund Wallet"
        : `Sigmund Wallet Testnet`,
    fromEmail: process.env.EMAIL_FROM ?? "no-reply@sigmundwallet.com",
  });

  const publishClient = new Redis(redisPort, redisHost);
  const subscribeClient = new Redis(redisPort, redisHost);
  const eventTarget = createRedisEventTarget({
    publishClient: publishClient,
    subscribeClient: subscribeClient,
  });
  const pubSub = createPubSub<PubSubPublishArgs>({
    eventTarget,
  });

  return {
    ...ctx,
    prisma,
    pubSub,
    blockchain: {
      bitcoin,
    },
    email,
  };
}

let context: Context | null = null;

// function to generate singleton context
export async function getContext() {
  if (!context) {
    context = await createContext({ session: null! });
  }
  return context;
}

export type Context = ExtractPromise<ReturnType<typeof createContext>>;

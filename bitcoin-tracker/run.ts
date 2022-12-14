import { createRedisEventTarget } from "@graphql-yoga/redis-event-target";
import { createPubSub } from "graphql-yoga";
import Redis from "ioredis";
import { BitcoinTracker, NetworkName } from "./BitcoinTracker";
import Pino from "pino";

const logger = Pino();

const redisPort = Number(process.env.REDIS_PORT ?? 6379);
const redisHost = process.env.REDIS_HOST ?? "localhost";
const polling = Boolean(process.env.TRACKER_POLLING);

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection, reason:", reason);
  // Recommended: send the information to sentry.io
  // or whatever crash reporting service you use
});

const publishClient = new Redis(redisPort, redisHost);
const subscribeClient = new Redis(redisPort, redisHost);
const eventTarget = createRedisEventTarget({
  publishClient,
  subscribeClient,
});
const pubSub = createPubSub({
  eventTarget,
});

const network = (process.env.BITCOIN_NETWORK as NetworkName) || "regtest";
const monthlyPriceSats = Number(process.env.MONTHLY_PRICE_SATS);
const trialPeriodDays = Number(process.env.TRIAL_PERIOD_DAYS);

const bitcoinTracker = new BitcoinTracker(pubSub, network, {
  logger,
  monthlyPriceSats,
  trialPeriodDays,
  polling,
});

export const run = async () => {
  await bitcoinTracker.init();

  await bitcoinTracker.start();
};

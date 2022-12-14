import { config } from "../config";

export function shorten(address: string, chars = 4) {
  return `${address.substring(0, chars)}...${address.substring(
    address.length - chars - 1
  )}`;
}

export const arrayify = <T>(maybeArray?: T | T[]): T[] =>
  Array.isArray(maybeArray) ? maybeArray : maybeArray ? [maybeArray] : [];

export const segwitMultisigPath = (
  account: number = 0,
  testnet = Boolean(config.isBitcoinTestnet)
) => `m/48'/${testnet ? 1 : 0}'/${account}'/2'`;

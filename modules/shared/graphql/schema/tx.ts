import DB from "@prisma/client";
import { builder } from "../builder";
import { getWalletWithAuthCheck, validateSessionSignatures } from "./utils";

const BitcoinTransactionSource = builder.enumType(DB.BitcoinTransactionSource, {
  name: "BitcoinTransactionSource",
});

builder.prismaObject("BitcoinTransaction", {
  fields: (t) => ({
    txHash: t.exposeID("txHash"),
    height: t.exposeInt("height", { nullable: true }),
    blockTimestamp: t.expose("blockTimestamp", {
      type: "DateTime",
      nullable: true,
    }),
    locktime: t.expose("locktime", { type: "BigInt" }),
    version: t.exposeInt("version"),
    label: t.exposeString("label", { nullable: true }),
    error: t.exposeString("error", { nullable: true }),
    source: t.expose("source", { type: BitcoinTransactionSource }),
    outputs: t.relation("outputs"),
    inputs: t.relation("inputs"),
  }),
});

builder.prismaObject("BitcoinOutput", {
  fields: (t) => ({
    id: t.field({
      type: "ID",
      resolve: (parent) => `${parent.txHash}:${parent.txPos}`,
    }),
    txHash: t.exposeString("txHash"),
    txPos: t.exposeInt("txPos"),
    value: t.expose("value", { type: "BigInt" }),
    scriptHash: t.exposeString("scripthash"),
    bitcoinTransaction: t.relation("BitcoinTransaction"),
    bitcoinAddress: t.relation("BitcoinAddress"),
    spentInTransaction: t.relation("spentInTransaction"),
  }),
});

builder.prismaObject("BitcoinAddress", {
  fields: (t) => ({
    address: t.exposeID("address"),
    change: t.exposeBoolean("change"),
    label: t.exposeString("label", { nullable: true }),
    lastStatus: t.exposeString("lastStatus", { nullable: true }),
    account: t.relation("Account"),
    bitcoinOutputs: t.relation("outputs"),
  }),
});

builder.queryFields((t) => ({
  walletTransactions: t.prismaField({
    type: ["BitcoinTransaction"],
    args: {
      walletId: t.arg.string({ required: true }),
      accountIndex: t.arg.int({ required: true }),
    },
    resolve: async (query, root, args, ctx) => {
      const { walletId, accountIndex } = args;

      await getWalletWithAuthCheck(walletId, ctx);

      return ctx.prisma.bitcoinTransaction.findMany({
        where: {
          OR: [
            {
              outputs: {
                some: {
                  BitcoinAddress: {
                    walletId,
                    accountIndex,
                  },
                },
              },
            },
            {
              inputs: {
                some: {
                  BitcoinAddress: {
                    walletId,
                    accountIndex,
                  },
                },
              },
            },
          ],
        },
        orderBy: {
          height: { sort: "desc", nulls: "first" },
        },
        ...query,
      });
    },
  }),
  transaction: t.prismaField({
    type: "BitcoinTransaction",
    nullable: true,
    args: {
      txHash: t.arg.string({ required: true }),
    },
    resolve: async (query, root, args, ctx) => {
      const { txHash } = args;

      return ctx.prisma.bitcoinTransaction.findUnique({
        where: { txHash },
        ...query,
      });
    },
  }),
}));

builder.mutationFields((t) => ({
  setTransactionLabel: t.prismaField({
    type: "BitcoinTransaction",
    args: {
      txHash: t.arg.string({ required: true }),
      label: t.arg.string({ required: true }),
    },
    resolve: async (query, root, args, ctx) => {
      const { txHash, label } = args;

      await validateSessionSignatures(ctx);

      return ctx.prisma.bitcoinTransaction.update({
        where: { txHash },
        data: { label },
        ...query,
      });
    },
  }),
}));

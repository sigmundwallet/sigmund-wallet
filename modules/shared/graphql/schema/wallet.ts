import DB from "@prisma/client";
import { builder } from "../builder";
import { BlockchainType } from "./enums";
import {
  getWalletRecoveryInfo,
  getWalletWithAuthCheck,
  RecoveryInfoItem,
  validateBilling,
  validateSessionSignatures,
} from "./utils";

builder.prismaObject("Account", {
  fields: (t) => ({
    walletId: t.exposeString("walletId"),
    wallet: t.relation("wallet"),
    index: t.exposeInt("index"),
    name: t.exposeString("name"),
    payLink: t.exposeString("payLink", { nullable: true }),
    bitcoinPaymentRequests: t.relation("bitcoinPaymentRequests", {
      query: {
        where: {
          OR: [
            {
              BitcoinTransaction: {
                is: null,
              },
            },
            {
              BitcoinTransaction: {
                source: DB.BitcoinTransactionSource.APP,
              },
            },
          ],
        },
      },
    }),
    receiveBitcoinAddress: t.field({
      type: "String",
      nullable: true,
      args: {
        accountIndex: t.arg.int(),
      },
      resolve: async (account, { accountIndex }, { prisma }) => {
        const emptyAddress = await prisma.bitcoinAddress.findFirst({
          where: {
            Account: {
              walletId: account.walletId,
              index: account.index,
            },
            change: false,
            outputs: {
              none: {},
            },
          },
          orderBy: {
            derivationIndex: "asc",
          },
        });

        return emptyAddress?.address;
      },
    }),
  }),
});

builder.prismaObject("Wallet", {
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    type: t.expose("type", { type: BlockchainType }),
    threshold: t.exposeInt("threshold"),
    keys: t.relation("keys", { query: { orderBy: { order: "asc" } } }),
    accounts: t.relation("Accounts", { query: { orderBy: { index: "asc" } } }),
  }),
});

const RecoveryInfoItemRef =
  builder.objectRef<RecoveryInfoItem>("RecoveryInfoItem");
builder.objectType(RecoveryInfoItemRef, {
  fields: (t) => ({
    type: t.exposeString("type"),
    publicKey: t.exposeID("publicKey"),
    derivationPath: t.exposeString("derivationPath"),
    masterFingerprint: t.exposeString("masterFingerprint"),
    walletType: t.exposeString("walletType"),
  }),
});

builder.queryFields((t) => ({
  wallet: t.prismaField({
    type: "Wallet",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, root, { id }, ctx) => {
      return await getWalletWithAuthCheck(id, ctx, query);
    },
  }),
  recoveryInfo: t.field({
    type: [RecoveryInfoItemRef],
    args: {
      walletId: t.arg.string({ required: true }),
      accountIndex: t.arg.int({ required: true }),
    },
    resolve: async (root, { walletId, accountIndex }, ctx) => {
      await validateSessionSignatures(ctx, {
        walletId,
        threshold: 2,
      });

      return getWalletRecoveryInfo(walletId, accountIndex, ctx);
    },
  }),
}));

builder.mutationFields((t) => ({
  createAccount: t.prismaField({
    type: "Account",
    args: {
      walletId: t.arg.string({ required: true }),
      name: t.arg.string(),
    },
    resolve: async (query, root, { walletId, name }, ctx) => {
      const wallet = await getWalletWithAuthCheck(
        walletId,
        ctx,
        {},
        {
          threshold: 2,
        }
      );

      const keys = await ctx.prisma.genericKey.findMany({
        where: {
          walletId,
        },
        select: {
          platformKey: {
            select: {
              paidUntil: true,
            },
          },
        },
      });

      if (!validateBilling(keys)) {
        throw new Error("Cannot create account, platform billing is invalid");
      }

      const lastAccount = await ctx.prisma.account.findFirst({
        where: {
          walletId: wallet.id,
        },
        orderBy: {
          index: "desc",
        },
      });

      const index = lastAccount ? lastAccount.index + 1 : 0;

      const account = await ctx.prisma.account.create({
        data: {
          name: name ?? `Account ${index}`,
          walletId: wallet.id,
          index,
        },
        ...query,
      });

      ctx.pubSub.publish("wallet-update", wallet.id);

      return account;
    },
  }),
  updateAccount: t.prismaField({
    type: "Account",
    args: {
      walletId: t.arg.string({ required: true }),
      index: t.arg.int({ required: true }),
      name: t.arg.string(),
      payLink: t.arg.string(),
    },
    resolve: async (query, root, { walletId, index, name, payLink }, ctx) => {
      await validateSessionSignatures(ctx, {
        walletId,
      });

      const keys = await ctx.prisma.genericKey.findMany({
        where: {
          walletId,
        },
        select: {
          platformKey: {
            select: {
              paidUntil: true,
            },
          },
        },
      });

      if (!validateBilling(keys)) {
        throw new Error("Cannot update account, platform billing is invalid");
      }

      const account = await ctx.prisma.account.update({
        where: {
          walletId_index: {
            walletId,
            index,
          },
        },
        data: {
          name: name ?? undefined,
          payLink: payLink ?? undefined,
        },
        ...query,
      });

      return account;
    },
  }),
}));

import { builder } from "../builder";
import { getWalletWithAuthCheck } from "./utils";

export const BitcoinWalletBalance = builder.objectRef<{
  confirmed: bigint;
  unconfirmed: bigint;
}>("BitcoinWalletBalance");

builder.objectType(BitcoinWalletBalance, {
  fields: (t) => ({
    confirmed: t.expose("confirmed", { type: "BigInt" }),
    unconfirmed: t.expose("unconfirmed", { type: "BigInt" }),
  }),
});

builder.queryFields((t) => ({
  bitcoinWalletBalance: t.field({
    type: BitcoinWalletBalance,
    args: {
      walletId: t.arg.string({ required: true }),
      accountIndex: t.arg.int({ required: true }),
    },
    smartSubscription: true,
    subscribe(subscriptions, parent, args, context, info) {
      subscriptions.register(
        `account-balance/${args.walletId}/${args.accountIndex}`
      );
    },
    resolve: async (_, { walletId, accountIndex }, ctx) => {
      await getWalletWithAuthCheck(walletId, ctx);

      const confirmed = await ctx.prisma.bitcoinOutput.aggregate({
        where: {
          BitcoinAddress: {
            walletId,
            accountIndex,
          },
          BitcoinTransaction: {
            height: {
              not: null,
            },
          },
          spentInTransaction: null,
        },
        _sum: {
          value: true,
        },
      });

      const unconfirmed = await ctx.prisma.bitcoinOutput.aggregate({
        where: {
          BitcoinAddress: {
            Account: {
              walletId,
              index: accountIndex ?? 0,
            },
          },
          BitcoinTransaction: {
            height: null,
          },
          spentInTransaction: null,
        },
        _sum: {
          value: true,
        },
      });

      return {
        confirmed: confirmed._sum.value ?? BigInt(0),
        unconfirmed: unconfirmed._sum.value ?? BigInt(0),
      };
    },
  }),
}));

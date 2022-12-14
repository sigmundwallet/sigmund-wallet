import { builder } from "../builder";

builder.prismaObject("BitcoinChainInfo", {
  fields: (t) => ({
    id: t.exposeString("id"),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    usdPrice: t.exposeFloat("usdPrice", { nullable: true }),
    feeRates: t.exposeFloatList("feeRates"),
    lastBlock: t.exposeInt("lastBlock"),
  }),
});

builder.queryFields((t) => ({
  bitcoinChainInfo: t.prismaField({
    type: "BitcoinChainInfo",
    smartSubscription: true,
    resolve: async (query, _, {}, { prisma, blockchain }) => {
      const chainInfo = await prisma.bitcoinChainInfo.findFirstOrThrow({
        where: {
          id: blockchain.bitcoin.isTestnet ? "BitcoinTestnet" : "Bitcoin",
        },
        ...query,
      });
      return chainInfo;
    },
  }),
}));

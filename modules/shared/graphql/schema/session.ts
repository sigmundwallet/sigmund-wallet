import { Session } from "@prisma/client";
import { builder } from "../builder";

const PartialSession = builder.prismaObject("Session", {
  variant: "PartialSession",
  fields: (t) => ({
    id: t.exposeID("id"),
    walletId: t.exposeID("walletId"),
    signMessageRequests: t.relation("signMessageRequests"),
    expiresAt: t.expose("expiresAt", { type: "DateTime", nullable: true }),
  }),
});

builder.queryFields((t) => ({
  session: t.prismaField({
    type: PartialSession,
    nullable: true,
    resolve: async (_, __, ___, { session }) => {
      return session as unknown as Session;
    },
  }),
}));

import { KeyOwnerShipType, SignMessageRequest } from "@prisma/client";
import { BitcoinProvider } from "../../providers/blockchain/BitcoinProvider";
import { segwitMultisigPath } from "../../utils";
import { builder } from "../builder";

builder.prismaObject("SignMessageRequest", {
  fields: (t) => ({
    id: t.exposeID("id"),
    expiresAt: t.expose("expiresAt", { type: "DateTime" }),
    signedWith: t.field({
      type: "String",
      nullable: true,
      resolve: async (request, _, { prisma }) => {
        const signMessageRequest =
          await prisma.signMessageRequest.findUniqueOrThrow({
            where: { id: request.id },
            select: {
              signedWith: {
                select: {
                  id: true,
                },
              },
            },
          });

        return signMessageRequest.signedWith?.id;
      },
    }),
  }),
});

const PartialSignMessageRequest = builder.objectRef<
  Pick<SignMessageRequest, "id" | "derivationPath">
>("PartialSignMessageRequest");

builder.objectType(PartialSignMessageRequest, {
  fields: (t) => ({
    id: t.exposeID("id"),
    derivationPath: t.exposeString("derivationPath"),
  }),
});

builder.mutationFields((t) => ({
  createSignMessageRequest: t.field({
    type: PartialSignMessageRequest,
    resolve: async (root, args, ctx) => {
      if (!ctx.session) {
        throw new Error("Not authenticated");
      }

      const signMessageRequest = await ctx.prisma.signMessageRequest.create({
        data: {
          wallet: {
            connect: {
              id: ctx.session.walletId,
            },
          },
          derivationPath: `${segwitMultisigPath()}/0/0`,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        },
        select: {
          id: true,
          derivationPath: true,
        },
      });

      return signMessageRequest;
    },
  }),
  signMessage: t.field({
    type: "Boolean",
    args: {
      msg: t.arg.string({ required: true }),
      signature: t.arg.string({ required: true }),
      keyId: t.arg.string(),
    },
    resolve: async (root, { msg, signature, keyId }, ctx) => {
      await ctx.prisma.signMessageRequest.findUniqueOrThrow({
        where: {
          id: msg,
        },
      });

      const wallet = await ctx.prisma.wallet.findUniqueOrThrow({
        where: {
          id: ctx.session.walletId,
        },
        include: {
          keys: {
            include: {
              bitcoinKey: true,
            },
            where: {
              ...(keyId
                ? {
                    id: keyId,
                  }
                : {}),
              ownershipType: KeyOwnerShipType.USER,
              bitcoinKey: {
                isNot: null,
              },
            },
          },
        },
      });

      for (const key of wallet.keys) {
        if (
          key.bitcoinKey &&
          BitcoinProvider.verifySignedMessage({
            message: msg,
            signature: signature,
            derivationSubPath: "0/0",
            xpub: key.bitcoinKey.publicKey,
          })
        ) {
          await ctx.prisma.genericKey.update({
            where: {
              id: key.id,
            },
            data: {
              lastVerifiedAt: new Date(),
              SignMessageRequests: {
                connect: {
                  id: msg,
                },
              },
            },
          });

          await ctx.prisma.session.update({
            where: {
              id: ctx.session.id,
            },
            data: {
              signMessageRequests: {
                connect: {
                  id: msg,
                },
              },
            },
          });

          return true;
        }
      }

      throw new Error("Invalid signature");
    },
  }),
}));

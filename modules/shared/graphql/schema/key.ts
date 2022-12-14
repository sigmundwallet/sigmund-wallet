import DB, { KeyOwnerShipType } from "@prisma/client";
import dayjs from "dayjs";
import { convertXpub } from "../../providers/blockchain/utils/convert";
import { builder } from "../builder";
import {
  BlockchainType,
  KeyOwnershipType,
  PlatformKeyVerificationType,
} from "./enums";
import { hashStrings, validateSessionSignatures } from "./utils";

builder.prismaObject("GenericKey", {
  name: "Key",
  fields: (t) => ({
    id: t.exposeID("id"),
    walletId: t.exposeString("walletId"),
    lastVerifiedAt: t.expose("lastVerifiedAt", { type: "DateTime" }),
    ownershipType: t.expose("ownershipType", { type: KeyOwnershipType }),
    blockchainType: t.expose("blockchainType", { type: BlockchainType }),
    name: t.exposeString("name", { nullable: true }),
    signatures: t.relation("SignMessageRequests", {
      nullable: true,
      query(args, ctx) {
        return {
          where: {
            id: {
              in: ctx.session?.signMessageRequests.map(
                (signature) => signature.id
              ) ?? [""],
            },
            expiresAt: {
              gt: new Date(),
            },
          },
        };
      },
    }),
  }),
});

builder.prismaObject("PlatformKey", {
  fields: (t) => ({
    id: t.exposeID("keyId"),
    verificationType: t.expose("verificationType", {
      type: PlatformKeyVerificationType,
    }),
    verificationPediod: t.exposeInt("verificationPediod"),
    quizQuestions: t.exposeStringList("quizQuestions"),
  }),
});

builder.prismaObject("PlatformKeyBilling", {
  fields: (t) => ({
    id: t.exposeID("id"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    basePrice: t.exposeInt("basePrice"),
    discountPrice: t.exposeInt("discountPrice"),
    amountPaid: t.exposeInt("amountPaid"),
    monthsPaid: t.exposeInt("monthsPaid"),
  }),
});

const PlatformKeyBillingSummary = builder.objectRef<{
  keyId: string;
  billingAddress: string;
  monthlyPriceSats: number;
  monthlyPriceDiscounted: number;
  paidUntil: Date;
}>("PlatformKeyBillingSummary");
builder.objectType(PlatformKeyBillingSummary, {
  fields: (t) => ({
    keyId: t.exposeID("keyId"),
    billingAddress: t.exposeString("billingAddress"),
    paidUntil: t.expose("paidUntil", { type: "DateTime" }),
    monthlyPriceSats: t.exposeInt("monthlyPriceSats"),
    monthlyPriceDiscounted: t.exposeInt("monthlyPriceDiscounted"),
    billing: t.prismaField({
      type: ["PlatformKeyBilling"],
      resolve: async (query, root, args, ctx) => {
        return await ctx.prisma.platformKeyBilling.findMany({
          where: {
            PlatformKey: {
              keyId: root.keyId,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          ...query,
        });
      },
    }),
  }),
});

builder.prismaObject("UserKey", {
  fields: (t) => ({
    id: t.exposeID("keyId"),
  }),
});

builder.prismaObject("BitcoinKey", {
  fields: (t) => ({
    id: t.exposeID("keyId"),
    publicKey: t.exposeString("publicKey"),
    derivationPath: t.exposeString("derivationPath"),
    masterFingerprint: t.exposeString("masterFingerprint"),
    walletType: t.exposeString("walletType"),
  }),
});

const PartialPlatformKey = builder.prismaObject("PlatformKey", {
  variant: "PartialPlatformKey",
  fields: (t) => ({
    id: t.exposeString("keyId"),
    verificationType: t.expose("verificationType", {
      type: PlatformKeyVerificationType,
    }),
    verificationPediod: t.exposeInt("verificationPediod"),
    quizQuestions: t.exposeStringList("quizQuestions"),
  }),
});

builder.prismaObject("PlatformKeySignRequest", {
  fields: (t) => ({
    id: t.exposeID("id"),
    expiresAt: t.expose("expiresAt", { type: "DateTime" }),
    isExpired: t.field({
      type: "Boolean",
      resolve: (root) => dayjs(root.expiresAt).isBefore(dayjs()),
    }),
    willSignAt: t.expose("willSignAt", { type: "DateTime", nullable: true }),
    signedAt: t.expose("signedAt", { type: "DateTime", nullable: true }),
    platformKey: t.prismaField({
      type: PartialPlatformKey,
      resolve: async (query, root, args, ctx) => {
        return await ctx.prisma.platformKey.findUniqueOrThrow({
          where: { keyId: root.platformKeyId },
          ...query,
        });
      },
    }),
  }),
});

builder.queryFields((t) => ({
  key: t.prismaField({
    type: "GenericKey",
    args: {
      keyId: t.arg.string({ required: true }),
    },
    resolve: async (query, root, { keyId }, ctx) => {
      const platformKey = await ctx.prisma.platformKey.findUnique({
        where: { keyId },
        select: { keyId: true },
      });
      await validateSessionSignatures(
        ctx,
        platformKey ? { threshold: 1 } : { shouldMatchKeyId: [keyId] }
      );

      const res = await ctx.prisma.genericKey.findUniqueOrThrow({
        where: { id: keyId },
        ...query,
      });

      return res;
    },
  }),
  bitcoinKey: t.prismaField({
    type: "BitcoinKey",
    args: {
      keyId: t.arg.string({ required: true }),
    },
    resolve: async (query, root, { keyId }, ctx) => {
      const platformKey = await ctx.prisma.platformKey.findUnique({
        where: { keyId },
        select: { keyId: true },
      });
      await validateSessionSignatures(
        ctx,
        platformKey ? { threshold: 2 } : { shouldMatchKeyId: [keyId] }
      );

      const bitcoinKey = await ctx.prisma.bitcoinKey.findFirstOrThrow({
        where: { keyId },
        ...query,
      });

      const letter = ctx.blockchain.bitcoin.getXKeyLetter();

      return {
        ...bitcoinKey,
        publicKey: convertXpub(bitcoinKey.publicKey, `${letter}pub`),
      };
    },
  }),
  platformKey: t.prismaField({
    type: PartialPlatformKey,
    args: {
      keyId: t.arg.string({ required: true }),
    },
    resolve: async (query, root, { keyId }, ctx) => {
      const key = await ctx.prisma.platformKey.findUniqueOrThrow({
        where: { keyId },
        select: {
          Key: {
            select: {
              walletId: true,
            },
          },
        },
      });

      await validateSessionSignatures(ctx, {
        threshold: 2,
        walletId: key.Key.walletId,
      });

      const platformKey = await ctx.prisma.platformKey.findUniqueOrThrow({
        where: { keyId },
        ...query,
      });

      return platformKey;
    },
  }),
  platformKeyBilling: t.field({
    type: PlatformKeyBillingSummary,
    args: {
      keyId: t.arg.string({ required: true }),
    },
    resolve: async (root, { keyId }, ctx) => {
      const key = await ctx.prisma.platformKey.findUniqueOrThrow({
        where: { keyId },
        select: {
          paidUntil: true,
          Key: {
            select: {
              walletId: true,
            },
          },
          BitcoinAddresses: {
            select: {
              address: true,
            },
          },
        },
      });

      await validateSessionSignatures(ctx, {
        threshold: 0,
        walletId: key.Key.walletId,
      });

      return {
        keyId,
        billingAddress: key.BitcoinAddresses[0].address,
        paidUntil: key.paidUntil,
        monthlyPriceSats: Number(process.env.MONTHLY_PRICE_SATS),
        monthlyPriceDiscounted: Number(process.env.MONTHLY_PRICE_DISCOUNTED),
      };
    },
  }),
}));

const UpdatePlatformKeyInput = builder.inputType("UpdatePlatformKeyInput", {
  fields: (t) => ({
    keyId: t.string({ required: true }),
    verificationPediod: t.int({ required: true }),
    quizQuestions: t.stringList({ required: true }),
    quizAnswers: t.stringList({ required: true }),
  }),
});

builder.mutationFields((t) => ({
  createPlatformKeySignRequest: t.prismaField({
    type: "PlatformKeySignRequest",
    args: {
      keyId: t.arg.string({ required: true }),
      bitcoinPaymentRequestId: t.arg.string(),
    },
    resolve: async (query, root, { keyId, bitcoinPaymentRequestId }, ctx) => {
      const key = await ctx.prisma.genericKey.findUniqueOrThrow({
        where: { id: keyId },
        select: {
          id: true,
          walletId: true,
          ownershipType: true,
          platformKey: {
            select: {
              keyId: true,
            },
          },
          bitcoinKey: {
            select: {
              privateKey: true,
            },
          },
        },
      });

      if (bitcoinPaymentRequestId) {
        // Validate bitcoin payment request
        const bitcoinPaymentRequest =
          await ctx.prisma.bitcoinPaymentRequest.findUniqueOrThrow({
            where: { id: bitcoinPaymentRequestId },
            select: {
              Account: {
                select: {
                  walletId: true,
                  index: true,
                },
              },
              psbt: true,
              PlatformKeySignRequest: {
                select: {
                  expiresAt: true,
                  willSignAt: true,
                },
              },
            },
          });

        if (!bitcoinPaymentRequest) {
          throw new Error("Bitcoin payment request not found");
        }

        if (
          bitcoinPaymentRequest.PlatformKeySignRequest &&
          (bitcoinPaymentRequest.PlatformKeySignRequest.expiresAt >
            new Date() ||
            bitcoinPaymentRequest.PlatformKeySignRequest.willSignAt)
        ) {
          throw new Error("Sign request already exists");
        }

        await validateSessionSignatures(ctx, {
          walletId: bitcoinPaymentRequest.Account.walletId,
          threshold: 0,
        });

        if (
          key.ownershipType !== KeyOwnerShipType.PLATFORM ||
          !key.bitcoinKey?.privateKey
        ) {
          throw new Error("Key can't be used to sign PSBT");
        }

        ctx.blockchain.bitcoin.signPSBT({
          psbt: bitcoinPaymentRequest.psbt,
          privateKey: key.bitcoinKey.privateKey,
        });
      } else {
        await validateSessionSignatures(ctx, { walletId: key.walletId });
      }

      const request = await ctx.prisma.platformKeySignRequest.create({
        data: {
          expiresAt: bitcoinPaymentRequestId
            ? dayjs().add(1, "hour").toDate()
            : dayjs().add(10, "minute").toDate(),
          PlatformKey: {
            connect: {
              keyId: key.id,
            },
          },
          ...(bitcoinPaymentRequestId && {
            BitcoinPaymentRequest: {
              connect: {
                id: bitcoinPaymentRequestId,
              },
            },
          }),
        },
      });

      return request;
    },
  }),
  confirmPlatformKeySignRequest: t.prismaField({
    type: "PlatformKeySignRequest",
    args: {
      id: t.arg.string({ required: true }),
      verification: t.arg.stringList({ required: true }),
    },
    resolve: async (query, root, { id, verification }, ctx) => {
      const request = await ctx.prisma.platformKeySignRequest.findUniqueOrThrow(
        {
          where: { id },
          select: {
            id: true,
            expiresAt: true,
            platformKeyId: true,
            PlatformKey: {
              select: {
                Key: {
                  select: {
                    walletId: true,
                    bitcoinKey: {
                      select: {
                        privateKey: true,
                      },
                    },
                  },
                },
                verificationType: true,
                verificationPediod: true,
                quizAnswerHash: true,
              },
            },
            BitcoinPaymentRequest: {
              select: {
                walletId: true,
                psbt: true,
                originalPsbt: true,
                isBillingAddress: true,
              },
            },
          },
        }
      );

      await validateSessionSignatures(ctx, {
        walletId: request.PlatformKey.Key.walletId,
        threshold: 0,
      });

      if (request.expiresAt < new Date()) {
        throw new Error("Request expired");
      }

      if (
        request.PlatformKey.verificationType ===
        DB.PlatformKeyVerificationType.QUIZ
      ) {
        const answersHash = hashStrings(...verification);

        if (answersHash !== request.PlatformKey.quizAnswerHash) {
          throw new Error("Verification failed");
        }
      }

      await ctx.prisma.genericKey.update({
        where: { id: request.platformKeyId },
        data: {
          lastVerifiedAt: new Date(),
        },
      });

      if (request.BitcoinPaymentRequest?.psbt) {
        if (!request.PlatformKey.Key.bitcoinKey?.privateKey) {
          throw new Error("Key can't be used to sign PSBT");
        }

        return await ctx.prisma.platformKeySignRequest.update({
          where: { id },
          data: {
            willSignAt: request.BitcoinPaymentRequest.isBillingAddress
              ? new Date()
              : dayjs()
                  .add(request.PlatformKey.verificationPediod, "seconds")
                  .toDate(),
          },
          ...query,
        });
      }

      return await ctx.prisma.platformKeySignRequest.findUniqueOrThrow({
        where: { id },
        ...query,
      });
    },
  }),
  deletePlatformKeySignRequest: t.field({
    type: "Boolean",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (root, { id }, ctx) => {
      const request = await ctx.prisma.platformKeySignRequest.findUniqueOrThrow(
        {
          where: { id },
          select: {
            id: true,
            PlatformKey: {
              select: {
                Key: {
                  select: {
                    walletId: true,
                  },
                },
              },
            },
          },
        }
      );

      await validateSessionSignatures(ctx, {
        walletId: request.PlatformKey.Key.walletId,
      });

      await ctx.prisma.platformKeySignRequest.delete({
        where: { id },
      });

      return true;
    },
  }),
  updatePlatformKey: t.prismaField({
    type: PartialPlatformKey,
    args: {
      input: t.arg({
        type: UpdatePlatformKeyInput,
        required: true,
      }),
    },
    resolve: async (query, root, { input }, ctx) => {
      const key = await ctx.prisma.platformKey.findUniqueOrThrow({
        where: { keyId: input.keyId },
        select: {
          updatedAt: true,
          Key: {
            select: {
              walletId: true,
            },
          },
        },
      });

      await validateSessionSignatures(ctx, {
        threshold: 2,
        walletId: key.Key.walletId,
      });

      if (key.updatedAt > dayjs().subtract(1, "day").toDate()) {
        throw new Error("Key can only be updated once per day");
      }

      const quizAnswerHash = hashStrings(...input.quizAnswers);

      return await ctx.prisma.platformKey.update({
        where: { keyId: input.keyId },
        data: {
          verificationPediod: input.verificationPediod,
          quizQuestions: input.quizQuestions,
          quizAnswerHash,
        },
        ...query,
      });
    },
  }),
}));

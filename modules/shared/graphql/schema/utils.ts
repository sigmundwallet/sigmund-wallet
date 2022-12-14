import DB, { KeyOwnerShipType } from "@prisma/client";
import { createHash } from "crypto";
import dayjs from "dayjs";
import { BitcoinProvider } from "modules/shared/providers/blockchain/BitcoinProvider";
import { convertXpub } from "../../providers/blockchain/utils/convert";
import { ExcludesNullable } from "../../utils/types";
import { Context } from "../context";

export type RecoveryInfoItem = Awaited<
  ReturnType<typeof getWalletRecoveryInfo>
>[number];

export const validateSessionSignatures = async (
  ctx: Context,
  options: {
    walletId?: string;
    threshold?: number;
    shouldMatchKeyId?: string[];
  } = {}
) => {
  const { threshold = 1, shouldMatchKeyId, walletId } = options;

  if (
    threshold > 0 &&
    (!ctx.session?.signMessageRequests ||
      !ctx.session.signMessageRequests.length)
  ) {
    throw new Error("No signatures");
  }

  if (walletId && walletId !== ctx.session.walletId) {
    throw new Error("Invalid wallet");
  }

  const validSignMessageRequests = ctx.session.signMessageRequests.filter(
    (item) => item.expiresAt > new Date()
  );

  const signedWith = new Set(
    validSignMessageRequests
      .map((item) => item.signedWith?.id)
      .filter(Boolean as unknown as ExcludesNullable)
  );

  if (shouldMatchKeyId) {
    shouldMatchKeyId.forEach((keyId) => {
      if (!signedWith.has(keyId)) {
        throw new Error(`Key ${keyId} not signed`);
      }
    });
  }

  if (signedWith.size < threshold) {
    throw new Error(
      `Not enough signatures: ${signedWith.size} of ${threshold}`
    );
  }

  return true;
};

export const getWalletWithAuthCheck = async (
  walletId: string,
  ctx: Context,
  query: {
    include?: DB.Prisma.WalletInclude | undefined;
    select?: DB.Prisma.WalletSelect | undefined;
  } = {},
  options: {
    threshold?: number;
    shouldMatchKeyId?: string[];
  } = {}
) => {
  const { threshold = 1, shouldMatchKeyId } = options;

  if (walletId !== ctx.session?.walletId) {
    throw new Error("Wallet not found");
  }

  const wallet = await ctx.prisma.wallet.findUniqueOrThrow({
    where: { id: walletId },
    ...query,
  });

  if (wallet.allowWatchMode) {
    return wallet;
  }

  await validateSessionSignatures(ctx, {
    walletId,
    threshold,
    shouldMatchKeyId,
  });

  return wallet;
};

export const validateBilling = (
  keys: { platformKey?: Pick<DB.PlatformKey, "paidUntil"> | null }[]
) => {
  const platformKeys = keys
    .map((key) => key.platformKey)
    .filter(Boolean as unknown as ExcludesNullable);

  if (
    !platformKeys.length ||
    platformKeys.some((platformKey) => {
      return dayjs(platformKey.paidUntil).isBefore(dayjs());
    })
  ) {
    return false;
  }

  return true;
};

export const hashStrings = (...list: string[]) => {
  const hash = createHash("sha256");
  list
    .map((item) => item.toLowerCase().trim())
    .sort()
    .forEach((item) => hash.update(item));
  return hash.digest("hex");
};

export const getWalletRecoveryInfo = async (
  walletId: string,
  accountIndex: number,
  ctx: Context
) => {
  const wallet = await ctx.prisma.wallet.findUnique({
    where: { id: walletId },
    include: {
      keys: {
        where: {
          bitcoinKey: {
            isNot: null,
          },
        },
        select: {
          ownershipType: true,
          bitcoinKey: {
            select: {
              publicKey: true,
              privateKey: true,
              derivationPath: true,
              masterFingerprint: true,
              walletType: true,
            },
          },
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  return wallet.keys.map((key) => {
    const {
      privateKey,
      publicKey: publicKeyRaw,
      derivationPath,
      ...publicRest
    } = key.bitcoinKey!;

    const letter = ctx.blockchain.bitcoin.getXKeyLetter();

    const publicKey = convertXpub(
      privateKey
        ? ctx.blockchain.bitcoin.deriveAccount(privateKey, accountIndex)
        : publicKeyRaw,
      `${letter}pub`
    );

    if (key.ownershipType === KeyOwnerShipType.PLATFORM) {
      if (!privateKey) {
        throw new Error("Platform key is missing private key");
      }
      return {
        type: "platform",
        ...publicRest,
        publicKey,
        derivationPath:
          ctx.blockchain.bitcoin.getAccountDerivationPath(accountIndex),
      };
    }

    return {
      type: "user",
      ...publicRest,
      derivationPath,
      publicKey,
    };
  });
};

export const updatePaymentRequestPsbt = async (
  args: {
    id: string;
    psbt?: string;
    memo?: string;
    query?: {
      select?: DB.Prisma.BitcoinPaymentRequestSelect;
      include?: DB.Prisma.BitcoinPaymentRequestInclude;
    };
  },
  ctx: {
    prisma: DB.PrismaClient;
    blockchain: {
      bitcoin: BitcoinProvider;
    };
  }
) => {
  const { id, psbt, memo, query } = args;
  const paymentRequest = await ctx.prisma.bitcoinPaymentRequest.findUnique({
    where: {
      id,
    },
    include: {
      Account: {
        include: {
          wallet: {
            include: {
              keys: {
                where: {
                  bitcoinKey: {
                    isNot: null,
                  },
                },
                include: {
                  bitcoinKey: {
                    select: {
                      publicKey: true,
                      derivationPath: true,
                      masterFingerprint: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      signedWithKeys: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!paymentRequest) {
    throw new Error("Payment request not found");
  }

  if (psbt) {
    if (psbt === paymentRequest.psbt) {
      throw new Error("PSBT is the same");
    }

    const keys = paymentRequest.Account.wallet.keys
      .map((key) => key.bitcoinKey)
      .filter(Boolean as unknown as ExcludesNullable);

    if (keys.length !== 3) {
      throw new Error("Wallet does not have 3 keys");
    }

    const { masterFingerprint: addedKeysFingerprints, updatedPSBT } =
      ctx.blockchain.bitcoin.validatePSBT({
        origPSBTEncoded: paymentRequest.originalPsbt,
        currentPSBTEncoded: paymentRequest.psbt,
        newPSBTEncoded: psbt,
      });

    // TODO: explore if this can be done in a single query
    const existingKeySignatures = new Set(
      paymentRequest.signedWithKeys.map((key) => key.id)
    );

    const signedKeys = paymentRequest.Account.wallet.keys
      .filter((key) =>
        addedKeysFingerprints.some(
          (addedKey) =>
            addedKey.toLowerCase() ===
            key.bitcoinKey!.masterFingerprint.toLowerCase()
        )
      )
      .filter((key) => !existingKeySignatures.has(key.id));

    const updatedPaymentRequest = await ctx.prisma.bitcoinPaymentRequest.update(
      {
        where: {
          id,
        },
        data: {
          psbt: updatedPSBT,
          signedWithKeys: {
            connect: signedKeys.map((key) => ({ id: key.id })),
            updateMany: signedKeys.map((key) => ({
              where: { id: key.id },
              data: { lastVerifiedAt: new Date() },
            })),
          },
        },
        ...query,
      }
    );

    return updatedPaymentRequest;
  } else if (memo) {
    const updatedPaymentRequest = await ctx.prisma.bitcoinPaymentRequest.update(
      {
        where: {
          id,
        },
        data: {
          memo,
        },
        ...query,
      }
    );

    return updatedPaymentRequest;
  }

  return paymentRequest;
};

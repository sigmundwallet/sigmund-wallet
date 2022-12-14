import { KeyOwnerShipType } from "@prisma/client";
import dayjs from "dayjs";
import { prisma } from "modules/shared/prisma";
import { BitcoinProvider } from "modules/shared/providers/blockchain/BitcoinProvider";
import { NextApiHandler } from "next";
import { NextResponse } from "next/server";
import { setCookie } from "cookies-next";

const signInHandler: NextApiHandler = async (req, res) => {
  const { walletId, signature } = req.body;

  if (!walletId) {
    return res.status(401).json({
      error: "Access code is required",
    });
  }

  const wallet = await prisma.wallet.findUnique({
    where: {
      id: walletId,
    },
    include: {
      keys: {
        include: {
          bitcoinKey: true,
        },
        where: {
          ownershipType: KeyOwnerShipType.USER,
          bitcoinKey: {
            isNot: null,
          },
        },
      },
    },
  });

  if (!wallet || !wallet.keys.length) {
    return res.status(401).json({
      error: "Wallet not found",
    });
  }

  if (wallet.allowWatchMode) {
    const session = await prisma.session.create({
      data: {
        wallet: {
          connect: {
            id: wallet.id,
          },
        },
        expiresAt: dayjs().add(1, "h").toDate(),
      },
      select: {
        id: true,
      },
    });

    setCookie("sigmund_session", session.id, { req, res });

    return res.status(200).json({
      id: wallet.id,
      signatures: [],
    });
  }

  if (!signature) {
    const { id, derivationPath } = await prisma.signMessageRequest.create({
      data: {
        wallet: {
          connect: {
            id: walletId,
          },
        },
        derivationPath: `${wallet.keys[0].bitcoinKey!.derivationPath}/0/0`,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
      select: {
        id: true,
        derivationPath: true,
      },
    });

    return res.status(401).json({
      error: "Signature is required",
      sign: {
        msg: id,
        derivationPath,
      },
    });
  }

  let parsed:
    | {
        msg: string;
        signature: string;
        derivationPath: string;
      }
    | undefined;

  try {
    parsed = JSON.parse(signature);
  } catch {
    return res.status(401).json({
      error: "Invalid signature",
    });
  }

  if (parsed) {
    await prisma.signMessageRequest.findUniqueOrThrow({
      where: {
        id: parsed.msg,
      },
    });
    
    for (const key of wallet.keys) {
      if (
        key.bitcoinKey &&
        BitcoinProvider.verifySignedMessage({
          message: parsed.msg,
          signature: parsed.signature,
          derivationSubPath: "0/0",
          xpub: key.bitcoinKey.publicKey,
        })
      ) {
        const result = await prisma.genericKey.update({
          where: {
            id: key.id,
          },
          data: {
            lastVerifiedAt: new Date(),
            SignMessageRequests: {
              connect: {
                id: parsed.msg,
              },
            },
          },
          select: {
            id: true,
            SignMessageRequests: {
              where: {
                id: parsed.msg,
              },
              select: {
                expiresAt: true,
              },
            },
          },
        });

        const session = await prisma.session.create({
          data: {
            wallet: {
              connect: {
                id: wallet.id,
              },
            },
            signMessageRequests: {
              connect: {
                id: parsed.msg,
              },
            },
          },
          select: {
            id: true,
          },
        });

        setCookie("sigmund_session", session.id, { req, res });

        return res.status(200).json({
          id: wallet.id,
          signatures: [
            {
              id: parsed.msg,
              expiresAt:
                result.SignMessageRequests?.[0].expiresAt ?? new Date(),
            },
          ],
        });
      }
    }
  }

  return res.status(401).json({
    error: "Wallet not found",
  });
};

export default signInHandler;

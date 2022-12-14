import {
  BlockchainType,
  KeyOwnerShipType,
  PlatformKeyVerificationType,
  Prisma,
} from "@prisma/client";
import dayjs from "dayjs";
import { getContext } from "modules/shared/graphql/context";
import {
  getWalletRecoveryInfo,
  hashStrings,
} from "modules/shared/graphql/schema/utils";
import { generateExportText } from "modules/shared/utils/generateExportText";
import { RemoveIndexSignature } from "modules/shared/utils/types";
import { NextApiHandler } from "next";
import * as yup from "yup";

const TRIAL_PERIOD_DAYS = Number(process.env.TRIAL_PERIOD_DAYS);
const BASE_XPUB = process.env.BASE_XPUB!; // TODO check if it's a valid xpub

const inputSchema = yup
  .object()
  .shape({
    platformKeys: yup
      .array()
      .of(
        yup.object().shape({
          confirmationType: yup
            .mixed()
            .oneOf([
              PlatformKeyVerificationType.EMAIL,
              PlatformKeyVerificationType.QUIZ,
            ])
            .required(),
          confirmationTime: yup.number().required(),
          quizQuestions: yup.array().of(yup.string().required()),
          quizAnswers: yup.array().of(yup.string().required()),
        })
      )
      .required(),
    userKeys: yup
      .array()
      .of(
        yup.object().strict().shape({
          xpub: yup.string().required(),
          derivationPath: yup.string().required(),
          masterFingerprint: yup.string().required(),
          walletType: yup.string().required(),
          userKeyVerificationId: yup.string().required(),
        })
      )
      .required(),
    emails: yup
      .array()
      .of(
        yup.object().strict().shape({
          email: yup.string().email().required(),
          verificationId: yup.string().required(),
        })
      )
      .required(),
    notifyOnSign: yup.boolean().required(),
    notifyOnSend: yup.boolean().required(),
    notifyOnReceive: yup.boolean().required(),
    notifyOnVerify: yup.boolean().required(),
    notifyOnPlatformKeySignRequest: yup.boolean().required(),
    notifyOnPlatformKeySign: yup.boolean().required(),
  })
  .strict();

export type CreateWalletInput = RemoveIndexSignature<
  yup.InferType<typeof inputSchema>
>;

const createHandler: NextApiHandler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send({ message: "Only POST requests allowed" });
  }

  const ctx = await getContext();

  const input = req.body as CreateWalletInput;

  try {
    await inputSchema.validate(input);

    if (input.platformKeys.length === 0) {
      throw new Error("Must have at least one platform key");
    }

    if (input.userKeys.length !== 2) {
      throw new Error("Must have exactly two user keys");
    }

    for (const key of input.userKeys) {
      if (key.derivationPath !== ctx.blockchain.bitcoin.segwitMultisigPath) {
        throw new Error(`Invalid derivation path: ${key.derivationPath}`);
      }
    }

    const userKeySet = new Set(input.userKeys.map((key) => key.xpub));
    if (userKeySet.size !== input.userKeys.length) {
      throw new Error("Duplicate user keys");
    }

    const blockchainType = ctx.blockchain.bitcoin.isTestnet
      ? BlockchainType.BitcoinTestnet
      : BlockchainType.Bitcoin;
    const { hdPrivateKey, hdPublicKey, derivationPath, masterFingerprint } =
      await ctx.blockchain.bitcoin.generatePrivateKey();

    const allKeys = [
      `${masterFingerprint}:${derivationPath}:${hdPublicKey}`,
      ...input.userKeys.map(
        (key) => `${key.masterFingerprint}:${key.derivationPath}::${key.xpub}`
      ),
    ];

    const id = hashStrings(...allKeys);
    const wallet = await ctx.prisma.$transaction(async ($prisma) => {
      const lastBitcoinAddress = await $prisma.bitcoinAddress.findFirst({
        where: {
          Account: {
            walletId: "billing",
          },
          baseXpub: BASE_XPUB,
        },
        orderBy: {
          derivationIndex: "desc",
        },
      });

      const derivationIndex = lastBitcoinAddress?.derivationIndex
        ? lastBitcoinAddress.derivationIndex + 1
        : 0;

      const billingAddress = ctx.blockchain.bitcoin.createAddress(
        BASE_XPUB,
        derivationIndex
      );

      if (!billingAddress) {
        throw new Error("Failed to create billing address");
      }

      const wallet = await $prisma.wallet.create({
        data: {
          id,
          type: blockchainType,
          threshold: 2,
          Accounts: {
            create: [
              {
                index: 0,
                name: "Main",
              },
            ],
          },
          allowWatchMode: false,
          keys: {
            create: [
              {
                ownershipType: KeyOwnerShipType.PLATFORM,
                name: "Platform Key",
                order: 0,
                blockchainType,
                bitcoinKey: {
                  create: {
                    publicKey: hdPublicKey,
                    privateKey: hdPrivateKey,
                    derivationPath,
                    masterFingerprint,
                    walletType: "platform",
                  },
                },
                platformKey: {
                  create: {
                    verificationType: input.platformKeys[0].confirmationType,
                    verificationPediod: input.platformKeys[0].confirmationTime,
                    quizQuestions: input.platformKeys[0].quizQuestions ?? [],
                    quizAnswerHash: hashStrings(
                      ...(input.platformKeys[0].quizAnswers ?? [])
                    ),
                    paidUntil: dayjs().add(TRIAL_PERIOD_DAYS, "days").toDate(),
                    BitcoinAddresses: {
                      create: [
                        {
                          address: billingAddress,
                          derivationIndex,
                          baseXpub: BASE_XPUB,
                          Account: {
                            connectOrCreate: {
                              where: {
                                walletId_index: {
                                  walletId: "billing",
                                  index: 0,
                                },
                              },
                              create: {
                                name: "billing",
                                index: 0,
                                wallet: {
                                  connectOrCreate: {
                                    where: {
                                      id: "billing",
                                    },
                                    create: {
                                      id: "billing",
                                      type: blockchainType,
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
              ...input.userKeys.map((userKey, index) => ({
                ownershipType: KeyOwnerShipType.USER,
                name: `User Key ${index + 1}`,
                order: index + 1,
                blockchainType,
                userKey: {
                  create: {},
                },
                bitcoinKey: {
                  create: {
                    publicKey: userKey.xpub,
                    derivationPath: userKey.derivationPath,
                    masterFingerprint: userKey.masterFingerprint.toLowerCase(),
                    walletType: userKey.walletType,
                  },
                },
              })),
            ],
          },
        },
        include: {
          keys: {
            include: {
              platformKey: true,
              userKey: true,
            },
          },
        },
      });

      return wallet;
    });

    ctx.pubSub.publish("wallet-update", wallet.id);

    const recoveryInfo = await getWalletRecoveryInfo(wallet.id, 0, ctx); // TODO use result of wallet creation

    if (input.emails.length) {
      for (const email of input.emails) {
        await ctx.email.sendEmail(
          email.email,
          "Your wallet has been created",
          `Your wallet recovery info is:\n\n${generateExportText({
            walletId: wallet.id,
            accountName: "Main",
            recoveryInfo,
          })}`
        );
      }
    }

    res.status(200).json({
      walletId: wallet.id,
      recoveryInfo,
    });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
};

export default createHandler;

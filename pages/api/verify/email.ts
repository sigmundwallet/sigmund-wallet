import dayjs from "dayjs";
import { getContext } from "modules/shared/graphql/context";
import { RemoveIndexSignature } from "modules/shared/utils/types";
import { NextApiHandler } from "next";
import * as yup from "yup";

const inputSchema = yup
  .object()
  .shape({
    email: yup.string().email().required(),
    verificationId: yup.string(),
    code: yup.string().when("verificationId", {
      is: (verificationId: string) => !!verificationId,
      then: yup.string().required(),
      otherwise: yup.string().notRequired(),
    }),
  })
  .strict();

export type VerifyEmailInput = RemoveIndexSignature<
  yup.InferType<typeof inputSchema>
>;

const verifyEmailHandler: NextApiHandler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send({ message: "Only POST requests allowed" });
  }

  const ctx = await getContext();

  try {
    const input = req.body as VerifyEmailInput;
    await inputSchema.validate(input);

    const { email, verificationId, code } = input;

    if (!verificationId) {
      const emailVerification = await ctx.prisma.emailVerification.create({
        data: {
          email,
          expiresAt: dayjs().add(1, "hour").toDate(),
          code: Math.floor(Math.random() * 900000 + 100000).toString(),
        },
      });

      await ctx.email.sendEmail(
        email,
        "Verify your email",
        `Your verification code is:\n\n${emailVerification.code}`
      );

      return res
        .status(200)
        .json({ email, verificationId: emailVerification.id });
    } else {
      const emailVerification = await ctx.prisma.emailVerification.findUnique({
        where: { id: verificationId },
      });

      if (!emailVerification) {
        throw new Error("Invalid verification id");
      }

      if (emailVerification.email !== email) {
        throw new Error("Email does not match verification id");
      }

      if (emailVerification.verified) {
        throw new Error("Email has already been verified");
      }

      if (emailVerification.code !== code) {
        throw new Error("Invalid verification code");
      }

      if (dayjs().isAfter(dayjs(emailVerification.expiresAt))) {
        throw new Error("Verification code has expired");
      }

      await ctx.prisma.emailVerification.update({
        where: { id: verificationId },
        data: { verified: true, verifiedAt: new Date() },
      });

      return res.status(200).json({ email, verificationId, verified: true });
    }
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
};

export default verifyEmailHandler;

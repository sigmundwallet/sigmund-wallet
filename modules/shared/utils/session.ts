import { getCookie } from "cookies-next";
import { OptionsType } from "cookies-next/lib/types";
import { NextApiRequest } from "next";
import { prisma } from "../prisma";

export type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export const getSession = async ({ req }: { req: OptionsType["req"] }) => {
  const sessionId = getCookie("sigmund_session", { req });
  if (typeof sessionId !== "string") {
    return;
  }

  return getSessionById(sessionId);
};

export const getSessionById = async (id: string) => {
  const session = await prisma.session.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      walletId: true,
      expiresAt: true,
      signMessageRequests: {
        select: {
          id: true,
          expiresAt: true,
          signedWith: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          expiresAt: "desc",
        },
      },
    },
  });

  if (!session) {
    return;
  }

  const expiresAt =
    session.expiresAt ?? session.signMessageRequests[0]?.expiresAt;

  if (expiresAt && expiresAt < new Date()) {
    return;
  }

  return session;
};

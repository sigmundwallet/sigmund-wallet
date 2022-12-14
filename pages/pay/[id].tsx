export { default } from "modules/pay/PayPage";

import { validateBilling } from "modules/shared/graphql/schema/utils";
import { prisma } from "modules/shared/prisma";
import { GetServerSidePropsContext } from "next";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  if (typeof context.query.id !== "string") {
    return {
      notFound: true,
    };
  }

  const emptyAddress = await prisma.bitcoinAddress.findFirst({
    where: {
      Account: {
        payLink: context.query.id,
      },
      change: false,
      outputs: {
        none: {},
      },
    },
    select: {
      address: true,
      Account: {
        select: {
          wallet: {
            select: {
              keys: {
                select: {
                  platformKey: {
                    select: {
                      paidUntil: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      derivationIndex: "asc",
    },
  });

  if (
    !emptyAddress?.Account?.wallet?.keys ||
    !validateBilling(emptyAddress.Account.wallet.keys)
  ) {
    return {
      notFound: true,
    };
  }

  if (!emptyAddress) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      receiveAddress: emptyAddress.address,
    },
  };
}

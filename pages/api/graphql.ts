import { deleteCookie } from "cookies-next";
import { createGraphQLError, createYoga } from "graphql-yoga";
import { Context, createContext } from "modules/shared/graphql/context";
import { schema } from "modules/shared/graphql/schema";
import { getSession } from "modules/shared/utils/session";
import { NextApiRequest, NextApiResponse } from "next";

const contextBySession = new Map<string, Context>();
let context: Context | undefined;

const yoga = createYoga({
  cors: false,
  schema,
  //@ts-ignore req exists on the context callback, see https://the-guild.dev/graphql/yoga-server/v2/integrations/integration-with-nextjs#nextauthjs
  context: async ({ req }) => {
    const session = (await getSession({ req }))!;
    
    if (!context) {
      context = await createContext({ session });
    }
    context.session = session;

    return context;
  },
  graphqlEndpoint: "/api/graphql",
});

// eslint-disable-next-line import/no-anonymous-default-export
export default async function (req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  if (!session) {
    deleteCookie("sigmund_session", { req, res });
    return res.status(401).json({
      error: "Session not found",
    });
  }

  return yoga(req, res);
}

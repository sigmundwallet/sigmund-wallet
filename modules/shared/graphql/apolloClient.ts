import { ApolloClient, InMemoryCache, from, HttpLink } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { toast } from "react-hot-toast";
import { config } from "../config";
// import { YogaLink } from "@graphql-yoga/apollo-link";
const { YogaLink } = require("@graphql-yoga/apollo-link"); // TEMPORARY FIX, see https://github.com/dotansimha/graphql-yoga/issues/2194

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, extensions }) =>
      toast.error((extensions?.originalError as any)?.message ?? message)
    );
  }
  if (operation.getContext().response.status === 401) {
    toast.error("Your session has expired, please log in again");
    window.location.href = "/wallet/open";
  }
});

const httpLink = new HttpLink({ uri: `${config.deploymentUrl}/api/graphql` });

const apolloClient = new ApolloClient({
  uri: "/api/graphql",
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Account: {
        keyFields: ["walletId", "index"],
      },
      BitcoinTransaction: {
        keyFields: ["txHash"],
      },
    },
  }),
});

export default apolloClient;

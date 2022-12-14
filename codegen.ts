import { printSchema } from "graphql";
import type { CodegenConfig } from "@graphql-codegen/cli";
import { schema } from "./modules/shared/graphql/schema";

const config: CodegenConfig = {
  schema: printSchema(schema),
  generates: {
    "modules/shared/graphql/client/index.tsx": {
      documents: "modules/**/*.gql",
      plugins: [
        "fragment-matcher",
        "typescript",
        "typescript-react-apollo",
        { "typescript-operations": { arrayInputCoercion: false } },
      ],
    },
  },
  config: {
    scalars: {
      DateTime: "Date",
      Date: "Date",
      BigInt: "number",
    },
  },
};

export default config;

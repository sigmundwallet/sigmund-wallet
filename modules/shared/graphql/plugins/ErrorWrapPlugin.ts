import SchemaBuilder, {
  BasePlugin,
  PothosOutputFieldConfig,
  SchemaTypes,
} from "@pothos/core";
import { GraphQLError, GraphQLFieldResolver } from "graphql";

const pluginName = "error-wrap-plugin" as const;

export default pluginName;

export class PothosErrorWrapPlugin<
  Types extends SchemaTypes
> extends BasePlugin<Types> {
  override wrapResolve(
    resolver: GraphQLFieldResolver<unknown, Types["Context"], object>,
    fieldConfig: PothosOutputFieldConfig<Types>
  ): GraphQLFieldResolver<unknown, Types["Context"], object> {
    return async (parent, args, context, info) => {
      try {
        return await resolver(parent, args, context, info);
      } catch (error) {
        if (error instanceof Error) {
          console.error(error.message, info.fieldName, args);
          throw new GraphQLError(error.message);
        }
        console.error(error);
        throw error;
      }
    };
  }
}

SchemaBuilder.registerPlugin(pluginName, PothosErrorWrapPlugin);

declare global {
  export namespace PothosSchemaTypes {
    export interface Plugins<Types extends SchemaTypes> {
      [pluginName]: PothosErrorWrapPlugin<Types>;
    }
  }
}

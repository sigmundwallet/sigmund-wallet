import SchemaBuilder from "@pothos/core";
import PrismaPlugin from "@pothos/plugin-prisma";
import type PrismaTypes from "@pothos/plugin-prisma/generated";
import ScopeAuthPlugin from "@pothos/plugin-scope-auth";
import SmartSubscriptionsPlugin, {
  subscribeOptionsFromIterator,
} from "@pothos/plugin-smart-subscriptions";
import {
  BigIntResolver,
  DateResolver,
  DateTimeResolver,
} from "graphql-scalars";
import { Context } from "modules/shared/graphql/context";
import { prisma } from "../prisma";
import { PubSubPublishArgs } from "../utils/types";
import PothosErrorWrapPlugin from "./plugins/ErrorWrapPlugin";

export const builder = new SchemaBuilder<{
  Context: Context;
  PrismaTypes: PrismaTypes;
  Scalars: {
    Date: { Input: Date; Output: Date };
    DateTime: { Input: Date; Output: Date };
    BigInt: { Input: bigint; Output: bigint };
  };
  AuthScopes: {
    public: boolean;
    user: boolean;
  };
}>({
  plugins: [
    PothosErrorWrapPlugin,
    PrismaPlugin,
    ScopeAuthPlugin,
    SmartSubscriptionsPlugin,
  ],
  smartSubscriptions: {
    ...subscribeOptionsFromIterator((name, { pubSub }) => {
      return pubSub.subscribe(name as keyof PubSubPublishArgs);
    }),
  },

  prisma: {
    client: prisma,
    filterConnectionTotalCount: true,
  },
  authScopes: async (context) => ({
    public: !context.session,
    user: !!context.session, // TODO: add real auth
  }),
});

builder.queryType();
builder.mutationType();
builder.subscriptionType();
builder.addScalarType("BigInt", BigIntResolver, {});
builder.addScalarType("DateTime", DateTimeResolver, {});
builder.addScalarType("Date", DateResolver, {});

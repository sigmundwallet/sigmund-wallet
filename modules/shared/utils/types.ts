import type { BlockchainType } from "@prisma/client";
import { NextPage } from "next";
import { FC } from "react";
import { UseFormHandleSubmit } from "react-hook-form";

export type NextPageWithLayout<P = any> = NextPage<P> & {
  getLayout?: FC<any>;
};

export type FormValues<T> = T extends UseFormHandleSubmit<infer R> ? R : never;

export type ExtractPromise<T> = T extends Promise<infer R> ? R : T;

export type ExcludesNullable = <T>(x: T | null | undefined) => x is T;

export type PubSubPublishArgs = {
  [key: `account-balance/${string}/${number}`]: [];
  [key: `blockchain-info/${string}`]: [];
  "broadcast-tx": [string];
  "wallet-update": [string];
};

export type RemoveIndexSignature<T> = {
  [Key in keyof T as Key extends `${infer R}`
    ? Key
    : never]: T[Key] extends any[]
    ? RemoveIndexSignature<T[Key][number]>[]
    : T[Key] extends Record<string, unknown>
    ? RemoveIndexSignature<T[Key]>
    : T[Key];
};

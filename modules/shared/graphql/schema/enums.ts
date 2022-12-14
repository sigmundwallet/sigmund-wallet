import DB from "@prisma/client";
import { builder } from "../builder";

export const KeyOwnershipType = builder.enumType(DB.KeyOwnerShipType, {
  name: "KeyOwnershipType",
});
export const PlatformKeyVerificationType = builder.enumType(
  DB.PlatformKeyVerificationType,
  { name: "PlatformKeyVerificationType" }
);
export const BlockchainType = builder.enumType(DB.BlockchainType, {
  name: "BlockchainType",
});

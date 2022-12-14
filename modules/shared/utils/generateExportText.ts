import type { RecoveryInfoItem } from "modules/shared/graphql/schema/utils";

export const generateExportText = (options: {
  walletId: string;
  accountName: string;
  destinationWallet?: string;
  recoveryInfo: RecoveryInfoItem[];
}) => {
  const {
    walletId,
    accountName,
    destinationWallet = "BlueWallet",
    recoveryInfo,
  } = options;

  const result = [
    `# ${destinationWallet} Multisig setup file (created by Sigmund)`,
  ];
  result.push(`# Sigmund ID: ${walletId}`);
  result.push(
    `Name: Sigmund Wallet ${walletId.substring(0, 8)}, ${accountName}`
  );
  result.push(`Policy: 2 of 3`); // TODO: get from data
  result.push(`Format: P2WSH`);

  recoveryInfo.forEach((item) => {
    result.push("");
    result.push(`# ${item.walletType}`);
    result.push(`Derivation: ${item.derivationPath}`);
    result.push(`${item.masterFingerprint}: ${item.publicKey}`);
  });

  return result.join("\n");
};

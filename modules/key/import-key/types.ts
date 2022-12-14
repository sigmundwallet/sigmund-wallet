export const walletTypes: {
  value: WalletType;
  label: string;
  modes: readonly WalletModes[];
}[] = [
  {
    value: "sigmund-signer",
    label: "Sigmund Signer",
    modes: ["import", "sign-message", "sign-psbt"],
  },
  {
    value: "ledger",
    label: "Ledger",
    modes: ["import", "sign-message", "sign-psbt"],
  },
  {
    value: "coldcard",
    label: "Coldcard",
    modes: ["import", "sign-message", "sign-psbt"],
  },
  {
    value: "passport",
    label: "Passport (File)",
    modes: ["import", "sign-message", "sign-psbt"],
  },
  {
    value: "passport-qrcode",
    label: "Passport (QR code)",
    modes: ["import", "sign-message", "sign-psbt"],
  },
  // {
  //   value: "seedsigner", // Will be added when it supports message signing
  //   label: "SeedSigner",
  //   modes: ["import", "sign-psbt"],
  // },
  {
    value: "jade-qrcode",
    label: "Jade (airgapped)",
    modes: ["import", "sign-message", "sign-psbt"],
  },
  {
    value: "manual",
    label: "Manual",
    modes: [], //["import", "sign-message", "sign-psbt"],
  },
];

export type WalletModes = "import" | "sign-message" | "sign-psbt";
export type WalletType =
  | "ledger"
  | "coldcard"
  | "passport"
  | "passport-qrcode"
  | "seedsigner"
  | "jade-qrcode"
  | "sigmund-signer"
  | "manual";

export type AccountData = {
  xpub: string;
  derivationPath: string;
  masterFingerprint: string;
  walletType: WalletType;
};

export type BaseHardwareKeyProps = {
  mode: WalletModes;

  onImport?: (data: AccountData) => void;

  psbt?: string;
  onPsbtSign?: (psbt: string) => void;

  messageToSign?: string;
  messageToSignDerivationPath?: string;
  onMessageSign?: (message: string) => void;
};

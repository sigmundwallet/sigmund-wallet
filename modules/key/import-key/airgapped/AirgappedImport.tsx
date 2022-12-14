import { Stack, Typography } from "@mui/material";
import dynamic from "next/dynamic";
import { FC, useState } from "react";
import { BaseHardwareKeyProps } from "../types";

const DynamicQrScanner = dynamic(
  () =>
    import("modules/shared/components/qr-scanner/QrScanner").then(
      (mod) => mod.QrScanner
    ),
  {
    loading: () => <div>Loading...</div>,
    ssr: false,
  }
);

export const AirgappedImport: FC<BaseHardwareKeyProps> = ({ onImport }) => {
  return (
    <Stack gap={2}>
      <Typography variant="h5">Airgapped Import</Typography>
      <DynamicQrScanner
        onResult={(result) => {
          if (result.type === "account") {
            const { type, ...wallet } = result;
            onImport?.({ ...wallet, walletType: "manual" });
          }
        }}
      />
    </Stack>
  );
};

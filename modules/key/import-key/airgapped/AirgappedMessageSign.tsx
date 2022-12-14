import { CryptoPSBT } from "@keystonehq/bc-ur-registry";
import { Button, Stack, Typography } from "@mui/material";
import { QrCode } from "modules/shared/components/qr-code/QrCode";
import { useToggle } from "modules/shared/hooks/useToggle";
import dynamic from "next/dynamic";
import { FC, useEffect, useMemo, useRef, useState } from "react";
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

export const AirgappedMessageSign: FC<BaseHardwareKeyProps> = ({
  messageToSign,
  messageToSignDerivationPath,
  onMessageSign,
}) => {
  const [showMessage, toggleShowMessage] = useToggle(true);
  const lastResultRef = useRef("");

  const fullMessage = useMemo(() => {
    if (!messageToSign) return;

    return `signmessage ${messageToSignDerivationPath} ascii:${messageToSign}`;
  }, [messageToSign, messageToSignDerivationPath]);

  return (
    <Stack gap={2}>
      <Typography variant="h5">Airgapped Sign Message</Typography>
      {showMessage && fullMessage ? (
        <Stack alignItems="center">
          <QrCode value={fullMessage} />
        </Stack>
      ) : (
        <DynamicQrScanner
          onResult={(result) => {
            if (result.type === "unknown") {
              if (result.data === lastResultRef.current) return;
              lastResultRef.current = result.data;
              const hex = Buffer.from(result.data, "base64").toString("hex");
              onMessageSign?.(hex);
            }
          }}
        />
      )}
      <Button variant="contained" onClick={toggleShowMessage}>
        {showMessage ? "Scan signed message" : "Show message"}
      </Button>
    </Stack>
  );
};

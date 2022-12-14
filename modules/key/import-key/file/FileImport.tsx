import { Button, FormHelperText, Stack, Typography } from "@mui/material";
import { Dropzone } from "modules/shared/components/dropzone/Dropzone";
import { FC, useState } from "react";
import { AccountData, BaseHardwareKeyProps } from "../types";
import { saveAs } from "file-saver";
import dayjs from "dayjs";

export const FileImport: FC<BaseHardwareKeyProps> = ({
  mode,
  onImport,
  psbt,
  onPsbtSign,
  onMessageSign,
  messageToSign,
  messageToSignDerivationPath,
}) => {
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();

    switch (mode) {
      case "import": {
        const asText = new TextDecoder().decode(arrayBuffer);
        let accountData: Omit<AccountData, "walletType"> | undefined;
        try {
          const json = JSON.parse(asText);

          // Coldcard
          if (
            typeof json.p2wsh === "string" &&
            typeof json.xfp === "string" &&
            typeof json.p2wsh_deriv === "string"
          ) {
            accountData = {
              xpub: json.p2wsh,
              masterFingerprint: json.xfp,
              derivationPath: json.p2wsh_deriv,
            };
          }

          if (
            json.bip48_2 &&
            json.bip48_2.xpub &&
            json.bip48_2.deriv &&
            json.xfp
          ) {
            accountData = {
              xpub: json.bip48_2.xpub,
              masterFingerprint: json.xfp, // Master fingerprint
              derivationPath: json.bip48_2.deriv,
            };
          }
        } catch (error) {}

        if (accountData) {
          onImport?.({ ...accountData, walletType: "manual" });
        } else {
          setError("Invalid wallet description file");
        }

        break;
      }
      case "sign-psbt": {
        const asBuffer = Buffer.from(arrayBuffer);

        if (asBuffer.subarray(0, 4).toString() === "psbt") {
          onPsbtSign?.(asBuffer.toString("base64"));
        } else {
          setError("Invalid PSBT file");
        }

        break;
      }
      case "sign-message": {
        const content = new TextDecoder().decode(arrayBuffer);

        const coldcardPattern = /-----BEGIN SIGNATURE-----\n.*\n([\s\S]*?)-----END BITCOIN SIGNED MESSAGE-----/;
        const match = content.match(coldcardPattern);
        if (match) {
          const signature = match[1];
          const hex = Buffer.from(signature, "base64").toString("hex");
          onMessageSign?.(hex);
        } else {
          onMessageSign?.(content);
        }

        break;
      }
    }
  };

  const handleDownload = () => {
    if (mode === "sign-psbt" && psbt) {
      const buffer = Buffer.from(psbt, "base64");
      const blob = new Blob([buffer], { type: "application/octet-stream" });

      saveAs(blob, `sigmund-${dayjs().format("YYYYMMDD")}.psbt`);
    } else if (mode === "sign-message" && messageToSign) {
      const text = `${messageToSign}\n${messageToSignDerivationPath}`;
      const blob = new Blob([text], {
        type: "text/plain;charset=utf-8",
      });

      saveAs(blob, "sigmund-message.txt");
    }
  };

  return (
    <Stack gap={2}>
      <Typography variant="h5">File Import</Typography>
      {(mode === "sign-psbt" || mode === "sign-message") && (
        <>
          <Button onClick={handleDownload}>
            Download{" "}
            {mode === "sign-psbt"
              ? "PSBT file to sign"
              : mode === "sign-message"
              ? "message file to sign"
              : ""}
          </Button>
        </>
      )}
      {error && <FormHelperText error>{error}</FormHelperText>}
      <Dropzone
        helper={
          mode === "import"
            ? "wallet description file"
            : mode === "sign-psbt"
            ? "signed PSBT file"
            : mode === "sign-message"
            ? "signed message file"
            : ""
        }
        onFile={handleFile}
      />
    </Stack>
  );
};

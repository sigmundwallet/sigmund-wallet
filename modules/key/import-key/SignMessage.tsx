import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { shorten } from "modules/shared/utils";
import dynamic from "next/dynamic";
import { FC, useEffect, useState } from "react";
import { AirgappedImport } from "./airgapped/AirgappedImport";
import { AirgappedMessageSign } from "./airgapped/AirgappedMessageSign";
import { FileImport } from "./file/FileImport";
import {
  AccountData,
  BaseHardwareKeyProps,
  WalletType,
  walletTypes,
} from "./types";

const DynamicLedgerImport = dynamic(
  () => import("./ledger/LedgerImport").then((mod) => mod.default),
  {
    ssr: false,
  }
);

const modeToComponent: Record<
  WalletType,
  React.ComponentType<BaseHardwareKeyProps>
> = {
  ledger: DynamicLedgerImport,
  coldcard: FileImport,
  passport: FileImport,
  "passport-qrcode": AirgappedMessageSign,
  "jade-qrcode": AirgappedMessageSign,
  "sigmund-signer": AirgappedMessageSign,
  seedsigner: () => <div>Not implemented</div>,
  manual: () => <div>Not implemented</div>,
};

export const SignMessage: FC<Required<
  Pick<
    BaseHardwareKeyProps,
    "onMessageSign" | "messageToSign" | "messageToSignDerivationPath"
  >
>> = ({ onMessageSign, messageToSign, messageToSignDerivationPath }) => {
  const [selectedMode, setSelectedMode] = useState<WalletType>(
    walletTypes.filter((walletType) => walletType.modes.includes("sign-message"))[0]
      .value
  );
  const [stage, setStage] = useState(0);

  const Component = modeToComponent[selectedMode];

  const handleMessageSign = (signedMessage: string) => {
    onMessageSign(signedMessage);
  };

  return (
    <Stack gap={2}>
      {stage === 0 ? (
        <>
          <FormControl fullWidth>
            <InputLabel>Wallet Type</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={selectedMode}
              label="Wallet Type"
              onChange={(event) => {
                setSelectedMode(event.target.value as WalletType);
              }}
              placeholder="Select Wallet Type"
            >
              {walletTypes
                .filter((walletType) =>
                  walletType.modes.includes("sign-message")
                )
                .map((walletType) => (
                  <MenuItem key={walletType.value} value={walletType.value}>
                    {walletType.label}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <Button variant="contained" onClick={() => setStage(stage + 1)}>
            Next
          </Button>
        </>
      ) : stage === 1 ? (
        <>
          <Component
            mode="sign-message"
            onMessageSign={handleMessageSign}
            messageToSign={messageToSign}
            messageToSignDerivationPath={messageToSignDerivationPath}
          />

          <Button variant="contained" onClick={() => setStage(stage - 1)}>
            Back
          </Button>
        </>
      ) : null}
    </Stack>
  );
};

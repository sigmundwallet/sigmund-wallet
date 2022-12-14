import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from "@mui/material";
import dynamic from "next/dynamic";
import { FC, useState } from "react";
import { AirgappedSignPSBT } from "./airgapped/AirgappedSignPSBT";
import { FileImport } from "./file/FileImport";
import { BaseHardwareKeyProps, WalletType, walletTypes } from "./types";

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
  "passport-qrcode": AirgappedSignPSBT,
  seedsigner: AirgappedSignPSBT,
  "jade-qrcode": AirgappedSignPSBT,
  "sigmund-signer": AirgappedSignPSBT,
  manual: () => <div>manual</div>,
};

export const SignPSBT: FC<Required<
  Pick<BaseHardwareKeyProps, "psbt" | "onPsbtSign">
>> = ({ psbt, onPsbtSign }) => {
  const [selectedMode, setSelectedMode] = useState<WalletType>(
    walletTypes.filter((walletType) => walletType.modes.includes("sign-psbt"))[0]
      .value
  );
  const [stage, setStage] = useState(0);

  const Component = modeToComponent[selectedMode];

  const handlePsbtSign = (signedPsbt: string) => {
    onPsbtSign(signedPsbt);
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
                .filter((walletType) => walletType.modes.includes("sign-psbt"))
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
          <Component mode="sign-psbt" psbt={psbt} onPsbtSign={handlePsbtSign} />

          <Button variant="contained" onClick={() => setStage(stage - 1)}>
            Back
          </Button>
        </>
      ) : null}
    </Stack>
  );
};

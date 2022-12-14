import {
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { segwitMultisigPath, shorten } from "modules/shared/utils";
import dynamic from "next/dynamic";
import { FC, useState } from "react";
import { AirgappedImport } from "./airgapped/AirgappedImport";
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

const derivationPath = segwitMultisigPath();

const modeToComponent: Record<
  WalletType,
  React.ComponentType<BaseHardwareKeyProps>
> = {
  ledger: DynamicLedgerImport,
  coldcard: FileImport,
  passport: FileImport,
  "passport-qrcode": AirgappedImport,
  seedsigner: AirgappedImport,
  "jade-qrcode": AirgappedImport,
  "sigmund-signer": AirgappedImport,
  manual: () => <div>manual</div>,
};

export const ImportKey: FC<Required<
  Pick<BaseHardwareKeyProps, "onImport">
>> = ({ onImport }) => {
  const [selectedMode, setSelectedMode] = useState<WalletType>(
    walletTypes.filter((walletType) => walletType.modes.includes("import"))[0]
      .value
  );
  const [stage, setStage] = useState(0);
  const [account, setAccount] = useState<AccountData | null>(null);
  const [error, setError] = useState("");

  const Component = modeToComponent[selectedMode];

  const handleImport = (account: AccountData) => {
    setAccount({
      ...account,
      walletType: selectedMode,
    });
    setStage(2);
    if (account.derivationPath !== derivationPath) {
      setError(
        `Derivation path ${account.derivationPath} does not match expected path ${derivationPath}`
      );
    }
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
                .filter((walletType) => walletType.modes.includes("import"))
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
          <Component mode="import" onImport={handleImport} />

          <Button variant="contained" onClick={() => setStage(stage - 1)}>
            Back
          </Button>
        </>
      ) : stage === 2 && account ? (
        <>
          <Stack>
            <Typography>{account.derivationPath}</Typography>
            <Typography>{account.masterFingerprint}</Typography>
            <Typography>{shorten(account.xpub, 6)}</Typography>
          </Stack>

          {error ? (
            <>
              <FormHelperText error>{error}</FormHelperText>
              <Button
                variant="contained"
                onClick={() => {
                  setStage(0);
                  setError("");
                  setAccount(null);
                }}
              >
                Back
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              onClick={() => {
                onImport(account);
              }}
            >
              Import
            </Button>
          )}
        </>
      ) : null}
    </Stack>
  );
};

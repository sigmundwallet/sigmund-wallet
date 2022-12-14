import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DownloadIcon from "@mui/icons-material/Download";
import { Box, Button, Stack, TextField } from "@mui/material";
import saveAs from "file-saver";
import { CopyWrapper } from "modules/shared/components/copy-button/CopyButton";
import {
  GetWalletQuery,
  useGetRecoveryInfoQuery,
} from "modules/shared/graphql/client";
import { useDialog } from "modules/shared/hooks/useDialog";
import { generateExportText } from "modules/shared/utils/generateExportText";
import { FC, useMemo } from "react";

export const ExportWallet: FC<{
  walletId: string;
  account: GetWalletQuery["wallet"]["accounts"][0];
}> = ({ walletId, account }) => {
  const { close } = useDialog();
  const { data } = useGetRecoveryInfoQuery({
    variables: {
      walletId,
      accountIndex: account.index,
    },
  });

  const destinationWallet = "BlueWallet";

  const forExport = useMemo(() => {
    return generateExportText({
      walletId,
      accountName: account.name,
      recoveryInfo: data?.recoveryInfo ?? [],
    });
  }, [data?.recoveryInfo, walletId, account.name]);

  const handleDownload = () => {
    const blob = new Blob([forExport], {
      type: "text/plain;charset=utf-8",
    });

    saveAs(
      blob,
      `sigmund-wallet-${walletId.substring(0, 8)}-${account.index}.txt`
    );
  };

  return (
    <Stack gap={2}>
      <TextField
        multiline
        rows="10"
        value={forExport}
        spellCheck={false}
        InputProps={{
          sx: { fontSize: "1rem" },
        }}
      />
      <Stack gap={2} direction="row" justifyContent="space-between">
        <CopyWrapper text={forExport}>
          {({ onClick }) => (
            <Button
              variant="outlined"
              onClick={onClick}
              startIcon={<ContentCopyOutlinedIcon />}
            >
              Copy
            </Button>
          )}
        </CopyWrapper>
        <Button
          variant="outlined"
          onClick={handleDownload}
          startIcon={<DownloadIcon />}
        >
          Download
        </Button>
        <Box flex={1} />
        <Button variant="outlined" color="secondary" onClick={close}>
          Close
        </Button>
      </Stack>
    </Stack>
  );
};

/*
# Passport Multisig setup file (created by Sparrow)
#
Name: testnet-sigmund
Policy: 2 of 3
Format: P2WSH

Derivation: m/48'/0'/0'/2'
00000000: tpubDEFJfYr6jHbnJwztCpdLGQf6u7unPeBbqTuhFNAbGqMxVec9FhGLcvrdua3VZ3Nab7Tb3LoEmeea8on1BAVz1oUQVLLz23NXKpJfzdJzqj3

Derivation: m/48'/1'/0'/2'
5931B47F: tpubDEjxFa6UffRH8XC2RnrgCtTAz3Vm9hTVKtcMqtk8aKb8v9iQQ95p9t9c4sy2pq5QQ1k5iMGEkbohzGujary2va3Tx64KQVgnQNXfZcwR5Cp

Derivation: m/48'/1'/0'/2'
178BE853: tpubDEtZmqo4yMYDWioGrXXWxLfTkkUGYJez9hcZVuuPFb9ZY4uDuFpPz2mGp19TkK3ppomgz659KMJ8uRqZniuEfvunhz3HTksLzNbpW4RxdHu


*/

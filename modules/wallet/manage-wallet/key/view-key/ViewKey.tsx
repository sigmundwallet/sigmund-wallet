import { Stack, Typography } from "@mui/material";
import { useGetBitcoinKeyQuery } from "modules/shared/graphql/client";
import { shorten } from "modules/shared/utils";
import { FC } from "react";

export const ViewKey: FC<{ keyId: string; accountIndex: number }> = ({
  keyId,
  accountIndex,
}) => {
  const { data } = useGetBitcoinKeyQuery({
    variables: {
      keyId,
    },
  });

  const key = data?.bitcoinKey;

  return (
    <Stack>
      {key && (
        <>
          <Typography>{key.walletType}</Typography>
          <Typography>{key.masterFingerprint}</Typography>
          <Typography>{key.derivationPath}</Typography>
          <Typography>{shorten(key.publicKey, 6)}</Typography>
        </>
      )}
    </Stack>
  );
};

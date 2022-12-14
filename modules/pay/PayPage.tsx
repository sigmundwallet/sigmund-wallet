import { Stack, Typography } from "@mui/material";
import BitcoinIcon from "modules/shared/assets/Bitcoin.svg";
import { Address } from "modules/shared/components/address/Address";
import { QrCode } from "modules/shared/components/qr-code/QrCode";
import { config } from "modules/shared/config";
import { NextPage } from "next";

const PayPage: NextPage<{
  description?: string;
  receiveAddress: string;
}> = ({ receiveAddress }) => {
  return (
    <Stack gap={2} alignItems="center">
      <Stack direction="row" gap={1} alignItems="center">
        <BitcoinIcon
          style={{
            fontSize: "2em",
            color: config.isBitcoinTestnet ? "#5fd15c" : "#f7931a",
          }}
        />
        <Typography variant="h5">Pay</Typography>
      </Stack>
      <Typography variant="subtitle2">Scan or copy receive address</Typography>
      <QrCode value={receiveAddress} />
      <Address variant="subtitle2" address={receiveAddress} />
    </Stack>
  );
};

export default PayPage;

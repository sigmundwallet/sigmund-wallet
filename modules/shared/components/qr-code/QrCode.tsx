import { Box, Stack } from "@mui/material";
import { FC } from "react";
import QRCode from "react-qr-code";

export const QrCode: FC<{ value: string }> = ({ value }) => {
  return (
    <Stack alignItems="start">
      <Box p={4} bgcolor="white" border="1px solid #E0E0E0">
        <QRCode value={value}  style={{ display: "block" }} />
      </Box>
    </Stack>
  );
};

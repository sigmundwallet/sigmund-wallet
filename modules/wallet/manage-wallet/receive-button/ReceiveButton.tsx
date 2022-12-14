import { Button, ButtonProps, Stack, Typography } from "@mui/material";
import { Address } from "modules/shared/components/address/Address";
import { Dialog } from "modules/shared/components/dialog/Dialog";
import { QrCode } from "modules/shared/components/qr-code/QrCode";
import { useToggle } from "modules/shared/hooks/useToggle";
import { FC } from "react";

export type ReceiveButtonProps = {
  address: string;
} & Omit<ButtonProps, "onClick">;

export const ReceiveButton: FC<ReceiveButtonProps> = ({
  address,
  ...props
}) => {
  const [open, toggleOpen] = useToggle();

  return (
    <>
      <Button {...props} onClick={toggleOpen} />
      {open && (
        <Dialog title="Receive Bitcoin" onClose={toggleOpen}>
          <Stack gap={2} alignItems="center">
            <Typography variant="subtitle2">
              Scan or copy receive address
            </Typography>
            <QrCode value={address} />
            <Address variant="subtitle2" address={address} />
            <Button variant="outlined" color="secondary" onClick={toggleOpen}>
              Close
            </Button>
          </Stack>
        </Dialog>
      )}
    </>
  );
};

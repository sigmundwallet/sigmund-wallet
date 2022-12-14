import { Button, Stack, Typography } from "@mui/material";
import { FC } from "react";
import { Dialog, DialogProps } from "./Dialog";

export type ConfirmationDialogProps = {
  prompt: string;
  onConfirm: () => void;
} & DialogProps;

export const ConfirmationDialog: FC<ConfirmationDialogProps> = ({
  prompt,
  onConfirm,
  ...props
}) => {
  return (
    <Dialog {...props}>
      <Stack gap={2}>
        <Typography>{prompt}</Typography>
        <Stack gap={2} direction="row">
          <Button color="secondary" variant="outlined" onClick={onConfirm} fullWidth>
            Confirm
          </Button>
          <Button color="primary" variant="contained" onClick={props.onClose} fullWidth>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
};

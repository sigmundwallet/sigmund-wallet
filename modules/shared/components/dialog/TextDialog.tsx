import { Button, Stack, TextField, Typography } from "@mui/material";
import { FC, useState } from "react";
import { Dialog, DialogProps } from "./Dialog";

export type TextDialogProps = {
  prompt?: string;
  value?: string;
  onSave: (value: string) => void;
} & DialogProps;

export const TextDialog: FC<TextDialogProps> = ({
  prompt,
  value: initialValue = "",
  onSave,
  ...props
}) => {
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  return (
    <Dialog {...props}>
      <Stack gap={2}>
        {prompt && <Typography>{prompt}</Typography>}
        <TextField value={value} onChange={handleChange} />
        <Stack gap={2} direction="row">
          <Button
            color="primary"
            variant="contained"
            onClick={async () => {
              setLoading(true);
              try {
                await onSave(value);
                props.onClose?.();
              } catch {}
              setLoading(false);
            }}
            fullWidth
            disabled={loading}
          >
            Save
          </Button>
          <Button
            color="secondary"
            variant="contained"
            onClick={props.onClose}
            fullWidth
          >
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
};

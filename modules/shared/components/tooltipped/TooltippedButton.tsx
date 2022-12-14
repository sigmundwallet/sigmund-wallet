import { Box, Button, ButtonProps, Tooltip } from "@mui/material";
import { FC } from "react";

export type TooltippedButtonProps = ButtonProps & { tooltip?: string };

export const TooltippedButton: FC<TooltippedButtonProps> = ({
  tooltip,
  ...props
}) => {
  return props.disabled && tooltip ? (
    <Tooltip title={tooltip}>
      <Box>
        <Button {...props} />
      </Box>
    </Tooltip>
  ) : (
    <Button {...props} />
  );
};

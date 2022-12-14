import { MenuItem, MenuItemProps, Tooltip } from "@mui/material";
import { FC } from "react";

export const TooltippedMenuItem: FC<MenuItemProps & { tooltip?: string }> = ({
  tooltip,
  ...props
}) => {
  return props.disabled && tooltip ? (
    <Tooltip title={tooltip}>
      <span>
        <MenuItem {...props} />
      </span>
    </Tooltip>
  ) : (
    <MenuItem {...props} />
  );
};

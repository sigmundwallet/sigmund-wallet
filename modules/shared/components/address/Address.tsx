import { Stack, Typography, TypographyProps } from "@mui/material";
import { FC } from "react";
import { CopyButton } from "../copy-button/CopyButton";

export const Address: FC<
  {
    copy?: boolean;
    address: string;
  } & TypographyProps
> = ({ address, copy = true, ...props }) => {
  return (
    <Stack display="inline-flex" direction="row" alignItems="center" gap={1}>
      <Typography
        sx={{ textOverflow: "ellipsis", overflow: "hidden", wordBreak: "break-all" }}
        {...props}
      >
        {address}
      </Typography>
      {copy && <CopyButton text={address} size="small" />}
    </Stack>
  );
};

import CloseIcon from "@mui/icons-material/Close";
import {
  DialogContent,
  DialogContentProps,
  DialogProps as MuiDialogProps,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DialogProvider } from "modules/shared/hooks/useDialog";
import { FC, ReactNode } from "react";
import { StyledDialog, StyledDialogTitle } from "./styles";

export type DialogProps = {
  headTitle?: ReactNode;
  title?: string;
  onClose?: () => void;
  open?: boolean;
  dialogContentProps?: DialogContentProps;
} & Omit<MuiDialogProps, "open" | "onClose">;

export const Dialog: FC<DialogProps> = ({
  headTitle,
  title,
  children,
  open = true,
  dialogContentProps,
  ...props
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <StyledDialog
      open={open}
      PaperProps={{ elevation: 0, sx: { maxWidth: "md", width: "100%" } }}
      fullScreen={fullScreen}
      {...props}
    >
      <StyledDialogTitle sx={{ padding: 4 }} as={"div"}>
        {typeof title == "string" ? (
          <Typography variant="h3">{title}</Typography>
        ) : (
          headTitle
        )}
        <IconButton
          aria-label="close"
          sx={{
            position: "absolute",
            right: 20,
            top: 20,
          }}
          onClick={props.onClose}
        >
          <CloseIcon fontSize="medium" />
        </IconButton>
      </StyledDialogTitle>

      <DialogContent
        sx={{
          paddingInline: { xs: 4, md: 4 },
          paddingBottom: 4,
          paddingTop: 0,
        }}
        {...dialogContentProps}
      >
        <DialogProvider
          value={{
            close: props.onClose ?? (() => {}),
          }}
        >
          {children}
        </DialogProvider>
      </DialogContent>
    </StyledDialog>
  );
};

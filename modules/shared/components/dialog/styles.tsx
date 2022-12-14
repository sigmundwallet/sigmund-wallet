import { Dialog, DialogTitle, styled } from "@mui/material";

export const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root.MuiDialog-paper": {
    [theme.breakpoints.up("md")]: {
      borderRadius: theme.spacing(4),
    },
    backgroundColor: theme.palette.background.default,
  },
}));

export const StyledDialogTitle = styled(DialogTitle)({
  textAlign: "center",
});

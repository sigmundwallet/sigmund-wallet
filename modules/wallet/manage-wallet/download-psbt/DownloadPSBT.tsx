import { Button, ButtonGroup, Menu, MenuItem } from "@mui/material";
import { FC } from "react";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import {
  usePopupState,
  bindTrigger,
  bindMenu,
} from "material-ui-popup-state/hooks";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { toast } from "react-hot-toast";

export const DownloadPSBT: FC<{ psbt: string }> = ({ psbt }) => {
  const popupState = usePopupState({ variant: "popover", popupId: "psbtMenu" });

  const handleDownload = () => {
    const buffer = Buffer.from(psbt, "base64");
    const blob = new Blob([buffer], { type: "application/octet-stream" });

    saveAs(blob, `sigmund-${dayjs().format("YYYYMMDD")}.psbt`);
    popupState.close();
  };

  const handleCopy = (format: "base64" | "hex") => () => {
    const text =
      format === "base64" ? psbt : Buffer.from(psbt, "base64").toString("hex");
    navigator.clipboard.writeText(text);
    toast.success(`PSBT has been copied to clipboard as ${format}`);
    popupState.close();
  };

  return (
    <ButtonGroup variant="contained" color="secondary">
      <Button
        onClick={handleDownload}
        sx={{
          flex: 1,
        }}
      >
        Download PSBT
      </Button>
      <Button size="small" {...bindTrigger(popupState)}>
        <ArrowDropDownIcon />
      </Button>
      <Menu {...bindMenu(popupState)}>
        <MenuItem onClick={handleCopy("base64")}>Copy as Base64</MenuItem>
        <MenuItem onClick={handleCopy("hex")}>Copy as Hex</MenuItem>
      </Menu>
    </ButtonGroup>
  );
};

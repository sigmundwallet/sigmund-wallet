import { styled } from "@mui/material";

export const StyledDropzone = styled("div")({
  border: "1px dashed #ccc",
  borderRadius: "4px",
  padding: "16px",
  textAlign: "center",
  cursor: "pointer",
  "&:hover": {
    border: "1px dashed #aaa",
  },
});

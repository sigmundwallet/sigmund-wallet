import { createTheme } from "@mui/material";

export const defaultTheme = createTheme({
  palette: {
    // mode: "dark",
    primary: {
      main: "#111",
      contrastText: "#fff",
    },
    secondary: {
      main: "#111",
    },
    background: {
      default: "#fafafa",
      paper: "#f7f7f7",
    },
    text: {
      primary: "#111",
    },
    warning: {
      //bitcoin orange
      main: "#f7931a",
    },
    // success: {
    //   main: "#4caf50",
    // },
  },
  typography: {
    // fontFamily: "Manrope",
    h1: {
      //   fontFamily: "Poppins",
      fontSize: "3.125rem",
      fontWeight: "bold",
    },
    h2: {
      //   fontFamily: "Poppins",
      fontSize: "2.25rem",
      fontWeight: 600,
    },
    h3: {
      //   fontFamily: "Poppins",
      fontSize: "1.565rem",
      fontWeight: 600,
    },
    body1: {
      fontSize: "1.315rem",
      fontWeight: 400,
      lineHeight: 1.815,
    },
    body2: {
      fontSize: "1.125rem",
      fontWeight: 300,
      lineHeight: 1.565,
    },
    subtitle1: {
      fontSize: "1.315rem",
      fontWeight: 600,
      lineHeight: 1.315,
    },
    caption: {
      fontSize: "0.75rem",
      fontWeight: 500,
      lineHeight: 1,
    },
    button: {
      //   fontFamily: "Poppins",
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.5,
      textTransform: "none",
    },
    overline: {
      //   fontFamily: "Poppins",
      fontSize: "1.25rem",
      textDecorationLine: "underline",
      fontWeight: 500,
      lineHeight: 1.875,
      textTransform: "none",
      letterSpacing: "none",
    },
  },
  components: {
    MuiInputLabel: {
      defaultProps: {
        shrink: true,
      },
      styleOverrides: {
        root: {
          position: "relative",
          transform: "none",
          fontSize: "0.75rem",
          marginLeft: 1,
          marginBottom: 2,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          ".MuiOutlinedInput-notchedOutline": {
            top: 0,
            "> legend": {
              display: "none",
            },
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: "none",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiButtonGroup: {
      defaultProps: {
        disableElevation: true,
      },
    },
  },
});

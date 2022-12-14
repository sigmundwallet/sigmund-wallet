import { Container, Link, Stack, Typography } from "@mui/material";
import TelegramIcon from "@mui/icons-material/Telegram";

export const Footer = () => {
  return (
    <Container maxWidth="md" component="footer">
      <Stack component="footer" gap={1} sx={{ py: 4, alignItems: "center" }}>
        <Typography variant="body2">
          © {new Date().getFullYear()} Sigmund Wallet
        </Typography>
        <Stack direction="row" gap={1}>
          <Link href="https://t.me/sigmundwallet" target="_blank">
            <TelegramIcon fontSize="large" />
          </Link>
        </Stack>
      </Stack>
    </Container>
  );
};

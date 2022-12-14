import {
  Box,
  Button,
  Container,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import SigmundArtSvg from "modules/shared/assets/Sigmund.svg";
import SigmundWalletSvg from "modules/shared/assets/SigmundWallet.svg";
import { Footer } from "modules/shared/components/footer/Footer";
import { NextPageWithLayout } from "modules/shared/utils/types";
import NextLink from "next/link";

const HomePage: NextPageWithLayout = () => {
  return (
    <Stack gap={4} alignItems="center">
      <Stack
        sx={{ alignItems: "center", width: "100%", maxWidth: 400 }}
        gap={4}
      >
        <SigmundWalletSvg />
        <SigmundArtSvg height="auto" width="100%" />
      </Stack>
      <Typography textAlign="center">
        Enjoy freedom and privacy with our KYC-free, registration-free, and
        tracker-free platform. Simply create a new wallet and start using it
        today.
      </Typography>
      <Stack
        direction={["column", "row"]}
        gap={2}
        sx={{
          alignItems: "center",
          justifyContent: "center",
          mb: 4,
          width: "100%",
          maxWidth: "sm",
        }}
      >
        <Button
          variant="contained"
          disableElevation
          fullWidth
          component={NextLink}
          href="/wallet/create"
        >
          Create wallet
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          fullWidth
          component={NextLink}
          href="/wallet/open"
        >
          Open existing wallet
        </Button>
      </Stack>
      <Typography variant="h2">How does it work?</Typography>
      <Typography variant="body1">
        Our web-based bitcoin wallet utilizes a 2-of-3 multisignature security
        approach to manage your funds. This means that in order to access and
        perform transactions with your bitcoins, a minimum of two keys out of
        the three are required. We provide one key, while you are responsible
        for securely generating and holding the other two. In the event that you
        lose one of your keys, our platform will provide its key, ensuring that
        you can still access your funds. This added security ensures that even
        if one of the keys is lost or compromised, your funds remain safe and
        secure as it requires two keys to access. Simply set up your account,
        generate and store your two private keys, and you're ready to start
        using our platform with peace of mind.
      </Typography>

      <Typography variant="h2">Key features</Typography>

      <Typography variant="h3">Security</Typography>
      <Typography variant="body1">
        Your funds are securely protected with our platform key, which has a
        built-in signing delay. This means that in the event of an unauthorized
        transaction, you have several days to cancel it. We also offer email
        notifications for each wallet operation, and the option to temporarily
        lock your wallet if you suspect any potential risk. Additionally,
        recovery is made easy with compatibility with popular wallets such as
        Sparrow and BlueWallet.
      </Typography>

      <Typography variant="h3">Privacy and censorship resistance</Typography>
      <Typography variant="body1">
        Our web-based platform operates independently of app stores and does not
        require any registration. To access your wallet, you'll simply need an
        access code and one of the keys stored on your hardware wallet.
      </Typography>

      <Typography variant="h3">
        Compatible with most popular hardware wallets
      </Typography>
      <Typography variant="body1">
        Ledger, Coldcard, Passport, SeedSigner, Blockstream Jade. And many more
        to come
      </Typography>

      <Typography variant="h3">24/7 Support</Typography>
      <Typography variant="body1">
        Our dedicated support team is available around the clock to assist you
        with any questions or concerns, and guide you through the wallet setup
        process. In the event of any incidents or problems, we are here to
        support you and your loved ones with the recovery of your wallet.
      </Typography>

      <Typography variant="h3">Pay with Bitcoin</Typography>
      <Typography variant="body1">
        Made for bitcoiners by bitcoiners. With our wallet, there's no need to
        deal with fiat currency. You can use the funds stored in your wallet to
        pay for our monthly subscription, which is currently set at 25000 sats
        and is expected to become even more affordable in the future.
      </Typography>

      <Typography variant="h3">Additional features</Typography>
      <Typography variant="body1">
        You can create multiple accounts for different purposes, use our payment
        server to receive payments, and generate a link to easily accept
        payments
      </Typography>

      <Footer />
    </Stack>
  );
};

HomePage.getLayout = ({ children }) => (
  <Container maxWidth="md" sx={{ pt: 4 }}>
    {children}
  </Container>
);

export default HomePage;

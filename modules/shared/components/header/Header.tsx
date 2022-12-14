import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import SigmundIcon from "modules/shared/assets/Sigmund.svg";
import { useGetSessionQuery } from "modules/shared/graphql/client";
import Link from "next/link";
import { FC, useEffect, useMemo, useState } from "react";
import SigmundWalletSvg from "modules/shared/assets/SigmundWallet.svg";

export const Header: FC<{ privateZone?: boolean }> = ({ privateZone }) => {
  const { data } = useGetSessionQuery({
    skip: !privateZone,
  });
  const [expiresIn, setExpiresIn] = useState<number>(0);

  const formatted = useMemo(() => {
    if (expiresIn < 0) {
      return "Session expired";
    }

    return `Session expires in ${dayjs.duration(expiresIn).format("HH:mm:ss")}`;
  }, [expiresIn]);

  const expiresAt = useMemo(() => {
    if (!data?.session) {
      return;
    }

    return dayjs(
      data.session.expiresAt ?? data.session.signMessageRequests[0]?.expiresAt
    );
  }, [data]);

  useEffect(() => {
    if (!expiresAt) {
      return;
    }

    const interval = setInterval(() => {
      setExpiresIn(expiresAt.diff(dayjs()));
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <Container maxWidth="lg" component="header">
      <Stack
        direction={["column", "row"]}
        gap={[1, 2]}
        sx={{
          py: 2,
          alignItems: "center",
          justifyContent: privateZone ? "start" : "center",
        }}
      >
        <Stack
          direction="row"
          gap={1}
          alignItems="center"
          color="secondary.main"
          component={Link}
          href="/"
          sx={{ textDecoration: "none" }}
        >
          <SigmundWalletSvg width={250} />
        </Stack>
        {privateZone && (
          <>
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" alignItems="center" gap={1}>
              {Boolean(expiresIn) && (
                <Typography variant="body2" color="text.primary">
                  {formatted}
                </Typography>
              )}
              <Button
                variant="outlined"
                color="secondary"
                component={Link}
                href="/api/wallet-auth/logout"
                prefetch={false}
              >
                Log out
              </Button>
            </Stack>
          </>
        )}
      </Stack>
      <Divider />
    </Container>
  );
};

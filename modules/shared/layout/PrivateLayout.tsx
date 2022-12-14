import { Box, Container, Stack } from "@mui/material";
import { FC, PropsWithChildren } from "react";
import { Footer } from "../components/footer/Footer";
import { Header } from "../components/header/Header";

export const PrivateLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Stack gap={[2, 4]}>
      <Header privateZone />
      <Container maxWidth="lg" sx={{ px: [2, 4], pb: 4 }}>
        <Box>{children}</Box>
      </Container>
      <Footer />
    </Stack>
  );
};

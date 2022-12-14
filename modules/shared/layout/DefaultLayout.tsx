import { Box, Container, Stack } from "@mui/material";
import { FC, PropsWithChildren } from "react";
import { Footer } from "../components/footer/Footer";
import { Header } from "../components/header/Header";

export const DefaultLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Stack gap={[2, 4]}>
      <Header />
      <Container maxWidth="md" sx={{ px: [2, 4], pb: 4 }}>
        <Box>{children}</Box>
      </Container>
      <Footer />
    </Stack>
  );
};

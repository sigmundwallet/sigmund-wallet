import { ApolloProvider } from "@apollo/client";
import { Alert, AlertColor, CssBaseline, ThemeProvider } from "@mui/material";
import { getPersistor } from "@rematch/persist";
import apolloClient from "modules/shared/graphql/apolloClient";
import { DefaultLayout } from "modules/shared/layout/DefaultLayout";
import { store } from "modules/shared/store";
import { defaultTheme } from "modules/shared/theme/defaultTheme";
import { NextPageWithLayout } from "modules/shared/utils/types";
import type { AppProps } from "next/app";
import Head from "next/head";
import { resolveValue, Toaster } from "react-hot-toast";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/lib/integration/react";

import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTimePlugin from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTimePlugin);
dayjs.extend(duration);

const persistor = getPersistor();

export default function App({
  Component,
  pageProps: { ...pageProps },
}: AppProps) {
  const Layout = (Component as NextPageWithLayout).getLayout ?? DefaultLayout;

  return (
    <>
      <Head>
        <title>Sigmund Wallet</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        ></meta>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <PersistGate persistor={persistor}>
        <Provider store={store}>
          <ApolloProvider client={apolloClient}>
            <ThemeProvider theme={defaultTheme}>
              <CssBaseline />
              <Layout {...pageProps}>
                <Component {...pageProps} />
              </Layout>
            </ThemeProvider>
          </ApolloProvider>
        </Provider>
      </PersistGate>
      <Toaster position="top-right">
        {(t) => (
          <Alert variant="filled" severity={t.type as AlertColor}>
            {resolveValue(t.message, t)}
          </Alert>
        )}
      </Toaster>
    </>
  );
}

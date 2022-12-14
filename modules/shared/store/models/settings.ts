import { createModel } from "@rematch/core";
import type { RootModel } from ".";

export enum CurrencyFormat {
  Sats = "sats",
  BTC = "btc",
  FIAT = "fiat",
}

export type SettingsState = {
  currencyFormat: CurrencyFormat;
};

export const settings = createModel<RootModel>()({
  state: {
    currencyFormat: CurrencyFormat.Sats,
  } as SettingsState,
  reducers: {
    toggleCurrencyFormat(state) {
      return {
        ...state,
        currencyFormat:
          state.currencyFormat === CurrencyFormat.Sats
            ? CurrencyFormat.BTC
            : state.currencyFormat === CurrencyFormat.BTC
            ? CurrencyFormat.FIAT
            : CurrencyFormat.Sats,
      };
    },
  },
});

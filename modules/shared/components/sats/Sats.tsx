import { usePrice } from "modules/shared/hooks/usePrice";
import { useSelector } from "modules/shared/store";
import { FC } from "react";

export const Sats: FC<{ amount?: number }> = ({ amount = 0 }) => {
  const currencyFormat = useSelector((state) => state.settings.currencyFormat);
  const usdPrice = usePrice();

  return (
    <>
      {currencyFormat === "sats"
        ? `${amount} sats`
        : currencyFormat === "fiat"
        ? `${((amount / 100000000) * usdPrice).toFixed(2)} USD`
        : `${amount / 100000000} BTC`}
    </>
  );
};

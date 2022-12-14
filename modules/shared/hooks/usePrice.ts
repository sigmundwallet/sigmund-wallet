import { useGetBitcoinChainInfoQuery } from "../graphql/client";

export const usePrice = () => {
  const { data } = useGetBitcoinChainInfoQuery();

  return data?.bitcoinChainInfo.usdPrice ?? 0;
};

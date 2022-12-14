export const config = {
  bitcoinNetwork: process.env.NEXT_PUBLIC_BITCOIN_NETWORK,
  isBitcoinTestnet: process.env.NEXT_PUBLIC_BITCOIN_NETWORK !== "bitcoin",
  bitcoinExplorerUrl: process.env.NEXT_PUBLIC_BITCOIN_EXPLORER_URL,
  deploymentUrl: process.env.NEXT_PUBLIC_DEPLOYMENT_URL,
};

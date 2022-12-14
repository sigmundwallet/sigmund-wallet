import { GetWalletTransactionsQuery } from "modules/shared/graphql/client";

export const transformTransactions = (
  transactions: GetWalletTransactionsQuery["walletTransactions"],
  walletId: string,
  accountIndex: number
) => {
  const matchesAccount = (account: { walletId: string; index: number }) =>
    account.walletId === walletId && account.index === accountIndex;

  return transactions.map((transaction) => {
    const myInputsValue = transaction.inputs
      .map((parentOutput) => {
        return parentOutput &&
          matchesAccount(parentOutput.bitcoinAddress.account)
          ? parentOutput.value
          : 0;
      })
      .reduce((a, b) => a + b, 0);

    const myOutputsValue = transaction.outputs
      .map((output) => {
        return matchesAccount(output.bitcoinAddress.account) ? output.value : 0;
      })
      .reduce((a, b) => a + b, 0);

    const destinationAddresses = transaction.outputs
      .filter((output) => !matchesAccount(output.bitcoinAddress.account))
      .map((output) => output.bitcoinAddress?.address);

    const allInputsValue = transaction.inputs
      .map((parentOutput) => {
        return parentOutput ? parentOutput.value : 0;
      })
      .reduce((a, b) => a + b, 0);

    const allOutputsValue = transaction.outputs
      .map((output) => output.value)
      .reduce((a, b) => a + b, 0);

    const type =
      myInputsValue > myOutputsValue
        ? ("sent" as const)
        : ("received" as const);

    const fee = type === "received" ? 0 : allInputsValue - allOutputsValue;

    const amount =
      type === "received"
        ? myOutputsValue
        : Math.abs(myInputsValue - myOutputsValue - fee);

    return {
      txHash: transaction.txHash,
      type,
      amount,
      fee,
      blockHeight: transaction.height,
      blockTimestamp: transaction.blockTimestamp,
      destinationAddresses,
      label: transaction.label,
    };
  });
};

export type TransformedTransaction = ReturnType<
  typeof transformTransactions
>[number];

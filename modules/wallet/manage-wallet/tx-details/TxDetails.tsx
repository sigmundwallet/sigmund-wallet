import { Button, Link, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { TextDialog } from "modules/shared/components/dialog/TextDialog";
import { Sats } from "modules/shared/components/sats/Sats";
import { config } from "modules/shared/config";
import { useSetTransactionLabelMutation } from "modules/shared/graphql/client";
import { useToggle } from "modules/shared/hooks/useToggle";
import { FC } from "react";
import { TransformedTransaction } from "../utils/transformTransactions";

export type TxDetailsProps = {
  transaction: TransformedTransaction;
};

export const TxDetails: FC<TxDetailsProps> = ({ transaction }) => {
  const [editMemoOpened, toggleEditMemoOpened] = useToggle();

  const [setTransactionLabel] = useSetTransactionLabelMutation();

  return (
    <Stack alignItems="start" gap={2}>
      <Stack sx={{ wordBreak: "break-all" }}>
        <Typography variant="body1">
          Tx Hash:{" "}
          <Link
            href={`${config.bitcoinExplorerUrl}/tx/${transaction.txHash}`}
            target="_blank"
          >
            {transaction.txHash}
          </Link>
        </Typography>
        {transaction.type === "sent" &&
          transaction.destinationAddresses.length > 0 && (
            <Typography variant="body1">
              To:{" "}
              <Link
                href={`${config.bitcoinExplorerUrl}/address/${transaction.destinationAddresses[0]}`}
                target="_blank"
              >
                {transaction.destinationAddresses[0]}
              </Link>
            </Typography>
          )}
        <Typography variant="body1">
          Amount: <Sats amount={transaction.amount} />
        </Typography>
        {Boolean(transaction.fee) && (
          <Typography variant="body1">
            Fee: <Sats amount={transaction.fee} />
          </Typography>
        )}
        <Typography variant="body1">
          {transaction.blockHeight
            ? dayjs(transaction.blockTimestamp).format("YYYY-MM-DD HH:mm")
            : "Unconfirmed"}
        </Typography>
        {transaction.label && (
          <Typography variant="body1">Memo: {transaction.label}</Typography>
        )}
      </Stack>
      <Button variant="outlined" onClick={toggleEditMemoOpened}>
        {transaction.label ? "Edit" : "Add"} memo
      </Button>

      {editMemoOpened && (
        <TextDialog
          title="Edit memo"
          onClose={toggleEditMemoOpened}
          value={transaction.label ?? ""}
          onSave={async (value) => {
            await setTransactionLabel({
              variables: {
                txHash: transaction.txHash,
                label: value,
              },
            });
          }}
        />
      )}
    </Stack>
  );
};

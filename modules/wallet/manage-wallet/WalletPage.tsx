import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import Check from "@mui/icons-material/Check";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ReceiveIcon from "@mui/icons-material/SaveAlt";
import SendIcon from "@mui/icons-material/Send";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  IconButton,
  Link,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import {
  bindMenu,
  bindTrigger,
  usePopupState,
} from "material-ui-popup-state/hooks";
import BitcoinIcon from "modules/shared/assets/Bitcoin.svg";
import { CopyButton } from "modules/shared/components/copy-button/CopyButton";
import { ConfirmationDialog } from "modules/shared/components/dialog/ConfirmationDialog";
import { Dialog } from "modules/shared/components/dialog/Dialog";
import { TextDialog } from "modules/shared/components/dialog/TextDialog";
import { Sats } from "modules/shared/components/sats/Sats";
import { TooltippedMenuItem } from "modules/shared/components/tooltipped/TooltippedMenuItem";
import { config } from "modules/shared/config";
import {
  useCreateAccountMutation,
  useGetBitcoinChainInfoQuery,
  useGetWalletBalanceQueryQuery,
  useGetWalletQuery,
  useGetWalletTransactionsQuery,
  useUpdateAccountMutation,
} from "modules/shared/graphql/client";
import { useToggle } from "modules/shared/hooks/useToggle";
import { PrivateLayout } from "modules/shared/layout/PrivateLayout";
import { useDispatch } from "modules/shared/store";
import { NextPageWithLayout } from "modules/shared/utils/types";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { ExportWallet } from "./export-wallet/ExportWallet";
import { Key } from "./key/Key";
import { PaymentRequest } from "./payment-request/PaymentRequest";
import { ReceiveButton } from "./receive-button/ReceiveButton";
import { SendButton } from "./send-button/SendButton";
import { TxDetails } from "./tx-details/TxDetails";
import { transformTransactions } from "./utils/transformTransactions";

const HomePage: NextPageWithLayout = () => {
  const { query } = useRouter();
  const [expandedTxHash, setExpandedTxHash] = useState<string>();
  const [currentAccountIndex, setCurrentAccount] = useState(0);
  const accountMenuState = usePopupState({
    variant: "popover",
    popupId: "accountMenu",
  });
  const miscMenuState = usePopupState({
    variant: "popover",
    popupId: "miscMenu",
  });
  const [editPayLinkOpened, toggleEditPayLink] = useToggle();
  const [editAccountNameOpened, toggleEditAccountName] = useToggle();
  const [exportWalletOpened, toggleExportWallet] = useToggle();
  const [createAccountOpened, toggleCreateAccount] = useToggle();

  const { settings } = useDispatch();

  const handleChange =
    (txId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedTxHash(isExpanded ? txId : undefined);
    };

  const { data: bitcoinChainInfoData } = useGetBitcoinChainInfoQuery();

  const { data: walletData, refetch: refetchWallet } = useGetWalletQuery({
    variables: {
      id: query.id as string,
    },
    skip: !query.id,
  });

  const account = walletData?.wallet.accounts[currentAccountIndex];

  const { data: walletBalanceData } = useGetWalletBalanceQueryQuery({
    variables: {
      walletId: walletData?.wallet.id!,
      accountIndex: currentAccountIndex,
    },
    skip: !walletData?.wallet.id,
    fetchPolicy: "network-only",
  });

  const { data: walletTransactionsData, refetch: refetchTransactions } =
    useGetWalletTransactionsQuery({
      variables: {
        walletId: walletData?.wallet.id!,
        accountIndex: currentAccountIndex,
      },
      skip: !walletData?.wallet.id,
    });

  const [createAccount, { loading: createAccountLoading }] =
    useCreateAccountMutation({
      onCompleted: () => {
        toast.success("Account created");
        refetchWallet();
      },
    });

  const [updateAccount, { loading: updateAccountLoading }] =
    useUpdateAccountMutation();

  const parsedTransactions = useMemo(
    () =>
      transformTransactions(
        walletTransactionsData?.walletTransactions ?? [],
        walletData?.wallet.id ?? "",
        currentAccountIndex
      ),
    [
      walletTransactionsData?.walletTransactions,
      walletData?.wallet.id,
      currentAccountIndex,
    ]
  );

  const signedUserKeysCount = useMemo(
    () =>
      walletData?.wallet.keys.filter((key) => key.signatures?.length).length ??
      0,
    [walletData?.wallet.keys]
  );

  return (
    <Stack gap={2}>
      <Stack gap={4}>
        <Stack direction="column" alignItems="center" gap={2}>
          <Stack direction={["column", "row"]} gap={2} alignItems="center">
            <Stack direction="row" gap={2} alignItems="center">
              <BitcoinIcon
                style={{
                  fontSize: "2em",
                  color: config.isBitcoinTestnet ? "#5fd15c" : "#f7931a",
                }}
              />
              <Typography variant="h4">
                {walletData?.wallet.name} {walletData?.wallet.threshold}-of-
                {walletData?.wallet.keys.length}
              </Typography>
            </Stack>
            <Stack direction="row" gap={2} alignItems="start">
              <Button
                variant="outlined"
                color="secondary"
                endIcon={<KeyboardArrowDownIcon />}
                {...bindTrigger(accountMenuState)}
              >
                {walletData?.wallet.accounts[currentAccountIndex]?.name}
              </Button>
              <Menu {...bindMenu(accountMenuState)}>
                {walletData?.wallet.accounts.map((account, index) => (
                  <MenuItem
                    key={account.index}
                    onClick={() => {
                      setCurrentAccount(account.index);
                      accountMenuState.close();
                    }}
                  >
                    {account.index === currentAccountIndex ? (
                      <>
                        <ListItemIcon>
                          <Check />
                        </ListItemIcon>
                        {account.name}
                      </>
                    ) : (
                      <ListItemText inset>{account.name}</ListItemText>
                    )}
                  </MenuItem>
                ))}
                <Divider />
                <TooltippedMenuItem
                  onClick={() => {
                    toggleCreateAccount();
                    accountMenuState.close();
                  }}
                  disabled={signedUserKeysCount < 2}
                  tooltip="You need at least 2 keys signed to create an account"
                >
                  Create account
                </TooltippedMenuItem>
              </Menu>

              <Button
                {...bindTrigger(miscMenuState)}
                variant="outlined"
                color="secondary"
                sx={{ minWidth: "unset", px: 1 }}
              >
                <MoreVertIcon />
              </Button>
              <Menu {...bindMenu(miscMenuState)}>
                <MenuItem
                  onClick={() => {
                    miscMenuState.close();
                    toggleEditAccountName();
                  }}
                >
                  Edit account name
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    miscMenuState.close();
                    toggleEditPayLink();
                  }}
                >
                  Edit pay link
                </MenuItem>
                <TooltippedMenuItem
                  onClick={() => {
                    miscMenuState.close();
                    toggleExportWallet();
                  }}
                  disabled={signedUserKeysCount < 2}
                  tooltip="You need at least 2 keys signed to export the wallet"
                >
                  Export wallet
                </TooltippedMenuItem>
                <TooltippedMenuItem
                  onClick={() => {
                    miscMenuState.close();
                  }}
                  disabled={signedUserKeysCount < 2}
                  tooltip="You need at least 2 keys signed to change the wallet settings"
                >
                  Settings
                </TooltippedMenuItem>
                <TooltippedMenuItem
                  onClick={() => {
                    miscMenuState.close();
                  }}
                  disabled={signedUserKeysCount < 2}
                  tooltip="You need at least 2 keys signed to lock the wallet"
                >
                  Lock wallet
                </TooltippedMenuItem>
              </Menu>
            </Stack>
          </Stack>
          {account?.payLink && (
            <Stack direction="row" gap={0} alignItems="center">
              <Typography variant="subtitle2">
                Pay link:{" "}
                <Link
                  component={NextLink}
                  href={`${config.deploymentUrl}/pay/${account.payLink}`}
                  target="_blank"
                >
                  {config.deploymentUrl}/pay/{account.payLink}
                </Link>
              </Typography>
              <CopyButton
                size="small"
                text={`${config.deploymentUrl}/pay/${account.payLink}`}
              />
            </Stack>
          )}
        </Stack>
        <Stack gap={2} alignItems="center">
          <Paper
            variant="outlined"
            sx={{ p: 2, bgcolor: "background.default", width: "100%" }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { sm: "repeat(3, 1fr)" },
                gap: 4,
              }}
            >
              {walletData?.wallet.keys.map((key) => (
                <Key
                  key={key.id}
                  data={key}
                  accountIndex={currentAccountIndex}
                  signedUserKeysCount={signedUserKeysCount}
                />
              ))}
            </Box>
          </Paper>
          <Button
            color="primary"
            onClick={settings.toggleCurrencyFormat}
            startIcon={<AccountBalanceWalletIcon />}
            sx={{ fontSize: "1.5rem", px: 4 }}
          >
            <Sats amount={walletBalanceData?.bitcoinWalletBalance.confirmed} />{" "}
            {Boolean(walletBalanceData?.bitcoinWalletBalance.unconfirmed) && (
              <>
                (
                <Sats
                  amount={walletBalanceData?.bitcoinWalletBalance.unconfirmed}
                />{" "}
                unconfirmed)
              </>
            )}
          </Button>
          {walletData?.wallet.id && account && (
            <Box
              display="grid"
              gridAutoColumns="1fr"
              gridAutoFlow="column"
              alignItems="center"
              justifyContent="center"
              gap={2}
              width="100%"
              maxWidth="sm"
              sx={{ mb: 2 }}
            >
              <SendButton
                variant="contained"
                color="primary"
                walletId={walletData.wallet.id}
                accountIndex={currentAccountIndex}
                currentBalance={
                  walletBalanceData?.bitcoinWalletBalance.confirmed ?? 0
                }
                onCreate={(paymentRequest) => {
                  refetchWallet();
                }}
                endIcon={<SendIcon />}
                disabled={account.bitcoinPaymentRequests.length > 0}
                tooltip="You can only have one pending payment request at a time"
                fullWidth
              >
                Send
              </SendButton>
              {account.receiveBitcoinAddress && (
                <ReceiveButton
                  variant="outlined"
                  color="primary"
                  address={account.receiveBitcoinAddress}
                  endIcon={<ReceiveIcon />}
                  fullWidth
                >
                  Receive
                </ReceiveButton>
              )}
            </Box>
          )}
          <Stack width="100%" maxWidth="md">
            <Typography variant="h3" sx={{ mb: 2 }}>
              Transactions
            </Typography>
            {!walletData?.wallet.accounts[currentAccountIndex]
              ?.bitcoinPaymentRequests.length &&
              !parsedTransactions.length && (
                <Typography variant="body2">No transactions yet</Typography>
              )}
            {Boolean(
              walletData?.wallet.accounts[currentAccountIndex]
                ?.bitcoinPaymentRequests.length
            ) &&
              walletData?.wallet.accounts[
                currentAccountIndex
              ].bitcoinPaymentRequests.map((paymentRequest) => (
                <Accordion
                  key={paymentRequest.id}
                  expanded={expandedTxHash === paymentRequest.id}
                  onChange={handleChange(paymentRequest.id)}
                  TransitionProps={{ unmountOnExit: true }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Stack
                      direction={"row"}
                      gap={2}
                      justifyContent="space-between"
                      alignItems={"center"}
                      flex={1}
                      sx={{ pr: 1 }}
                    >
                      <Typography sx={{ wordBreak: "break-all" }}>
                        Send to{" "}
                        <Typography
                          component="span"
                          color="secondary.main"
                          fontWeight="500"
                        >
                          {paymentRequest.address}
                        </Typography>
                      </Typography>
                      <Typography variant="body1">
                        <Sats amount={paymentRequest.amount} />
                      </Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 2, overflow: "hidden" }}>
                    <PaymentRequest
                      paymentRequestId={paymentRequest.id}
                      wallet={walletData.wallet}
                      onBroadcast={() => {
                        refetchWallet();
                        refetchTransactions();
                      }}
                    />
                  </AccordionDetails>
                </Accordion>
              ))}
            {parsedTransactions?.map((transaction) => (
              <Accordion
                key={transaction.txHash}
                expanded={expandedTxHash === transaction.txHash}
                onChange={handleChange(transaction.txHash)}
                TransitionProps={{ unmountOnExit: true }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack
                    direction={"row"}
                    gap={2}
                    justifyContent="space-between"
                    alignItems={"center"}
                    flex={1}
                    sx={{ pr: 1 }}
                  >
                    <Stack gap={1}>
                      <Typography variant="body2">
                        {transaction.type === "sent" ? "Sent" : "Received"}
                      </Typography>
                      <Typography variant="caption">
                        {transaction.blockHeight
                          ? dayjs(transaction.blockTimestamp).format(
                              "YYYY-MM-DD HH:mm"
                            )
                          : "Unconfirmed"}
                      </Typography>
                    </Stack>
                    <Typography variant="body1">
                      {transaction.type === "sent" ? "-" : "+"}
                      <Sats amount={transaction.amount} />
                    </Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 2, overflow: "hidden" }}>
                  <TxDetails transaction={transaction} />
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Stack>
        <Typography variant="caption" textAlign="center" mt={4}>
          Last synced block:{" "}
          <Link
            target="_blank"
            href={`${config.bitcoinExplorerUrl}/block/${bitcoinChainInfoData?.bitcoinChainInfo.lastBlock}`}
          >
            {bitcoinChainInfoData?.bitcoinChainInfo.lastBlock}
          </Link>
        </Typography>
      </Stack>
      {editPayLinkOpened && (
        <TextDialog
          prompt="Paylink alias"
          value={account?.payLink ?? ""}
          onSave={async (value) => {
            await updateAccount({
              variables: {
                walletId: walletData?.wallet.id!,
                index: currentAccountIndex,
                payLink: value,
              },
            });
          }}
          onClose={toggleEditPayLink}
        />
      )}
      {editAccountNameOpened && (
        <TextDialog
          prompt="Account name"
          value={account?.name ?? ""}
          onSave={async (value) => {
            await updateAccount({
              variables: {
                walletId: walletData?.wallet.id!,
                index: currentAccountIndex,
                name: value,
              },
            });
          }}
          onClose={toggleEditAccountName}
        />
      )}
      {exportWalletOpened && account && (
        <Dialog
          title={`Export wallet: ${account.name}`}
          onClose={toggleExportWallet}
        >
          <ExportWallet walletId={walletData?.wallet.id!} account={account} />
        </Dialog>
      )}
      {createAccountOpened && (
        <ConfirmationDialog
          title="Create account"
          prompt="Create a new account?"
          onClose={toggleCreateAccount}
          onConfirm={async () => {
            const result = await createAccount({
              variables: {
                walletId: walletData?.wallet.id!,
              },
            });
            if (result.data?.createAccount) {
              setCurrentAccount(result.data.createAccount.index);
              toggleCreateAccount();
            }
          }}
        />
      )}
    </Stack>
  );
};

HomePage.getLayout = (page) => <PrivateLayout {...page} />;

export default HomePage;

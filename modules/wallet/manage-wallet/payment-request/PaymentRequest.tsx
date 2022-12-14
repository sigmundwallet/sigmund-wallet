import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { SignPSBT } from "modules/key/import-key/SignPsbt";
import { ConfirmationDialog } from "modules/shared/components/dialog/ConfirmationDialog";
import { Dialog } from "modules/shared/components/dialog/Dialog";
import { TextDialog } from "modules/shared/components/dialog/TextDialog";
import { Sats } from "modules/shared/components/sats/Sats";
import {
  BitcoinTransactionSource,
  GetBitcoinPaymentRequestQuery,
  GetWalletQuery,
  KeyOwnershipType,
  useBroadcastBitcoinPaymentRequestMutation,
  useCreatePlatformKeySignRequestMutation,
  useDeletePlatformKeySignRequestMutation,
  useGetBitcoinPaymentRequestQuery,
  useRemoveBitcoinPaymentRequestMutation,
  useUpdateBitcoinPaymentRequestMutation,
} from "modules/shared/graphql/client";
import { useToggle } from "modules/shared/hooks/useToggle";
import { FC, useMemo, useState } from "react";
import { DownloadPSBT } from "../download-psbt/DownloadPSBT";
import { PlatformKeySign } from "./PlatformKeySign";

export type PaymentRequestProps = {
  paymentRequestId: string;
  wallet: GetWalletQuery["wallet"];
  onBroadcast: () => void;
};

export const PaymentRequest: FC<PaymentRequestProps> = ({
  paymentRequestId,
  wallet,
  onBroadcast,
}) => {
  const {
    data,
    loading,
    refetch: refetchPaymentRequest,
  } = useGetBitcoinPaymentRequestQuery({
    variables: {
      id: paymentRequestId,
    },
  });

  const request = data?.bitcoinPaymentRequest;

  const [platformKeySignRequest, setPlatformKeySignRequest] = useState<
    GetBitcoinPaymentRequestQuery["bitcoinPaymentRequest"]["signRequest"]
  >();

  const [userSignOpened, toggleUserSignOpened] = useToggle();
  const [platformSignOpened, togglePlatformSignOpened] = useToggle();
  const [
    cancelPlatformSignOpened,
    toggleCancelPlatformSignOpened,
  ] = useToggle();
  const [confirmRemoveOpened, toggleConfirmRemoveOpened] = useToggle();
  const [editMemoOpened, toggleEditMemoOpened] = useToggle();

  const [
    createPlatformKeySignRequest,
    { loading: createPlatformKeySignRequestLoading },
  ] = useCreatePlatformKeySignRequestMutation();
  const [
    deletePlatformKeySignRequest,
  ] = useDeletePlatformKeySignRequestMutation({
    onCompleted: () => refetchPaymentRequest(),
  });

  const [
    updateBitcoinPaymentRequest,
    { loading: updateBitcoinPaymentRequestLoading },
  ] = useUpdateBitcoinPaymentRequestMutation();

  const [
    broadcastBitcoinPaymentRequest,
    { loading: broadcastBitcoinPaymentRequestLoading },
  ] = useBroadcastBitcoinPaymentRequestMutation();

  const [removeBitcoinPaymentRequest] = useRemoveBitcoinPaymentRequestMutation({
    refetchQueries: ["GetWallet"],
  });

  const broadcast = async () => {
    await broadcastBitcoinPaymentRequest({
      variables: {
        id: paymentRequestId,
      },
    });

    onBroadcast();
  };

  const requestPlatformKeySign = async () => {
    if (request?.signRequest && !request?.signRequest.isExpired) {
      setPlatformKeySignRequest(request.signRequest);
      togglePlatformSignOpened();
      return;
    }

    const keyId = wallet.keys.find(
      (k) => k.ownershipType === KeyOwnershipType.Platform
    )?.id;
    if (!keyId) {
      return;
    }
    const result = await createPlatformKeySignRequest({
      variables: {
        keyId,
        bitcoinPaymentRequestId: paymentRequestId,
      },
    });

    if (result.data?.createPlatformKeySignRequest) {
      setPlatformKeySignRequest(result.data.createPlatformKeySignRequest);
      togglePlatformSignOpened();
      refetchPaymentRequest();
    }
  };

  const satisfiesThreshold =
    (request?.signedWithKeys.length ?? 0) >= wallet.threshold;

  const willSignIn = useMemo(() => {
    if (!request?.signRequest?.willSignAt) {
      return false;
    }

    const diff = dayjs(request?.signRequest?.willSignAt).diff(dayjs());

    if (diff < 0) {
      return "now";
    }

    return dayjs.duration(diff).humanize();
  }, [request?.signRequest?.willSignAt]);

  return (
    <Stack gap={2}>
      {loading ? (
        <CircularProgress />
      ) : (
        <Stack gap={2}>
          {Boolean(request?.signedWithKeys.length) && (
            <Typography variant="body1">
              Signed with:{" "}
              {request?.signedWithKeys.map((k) => k.name).join(", ")}
            </Typography>
          )}
          {!request?.signRequest?.signedAt && willSignIn && (
            <Stack direction="row" gap={2} alignItems="center">
              <Typography variant="body1">
                Will be signed by platform key in {willSignIn}
              </Typography>
              <Button
                variant="outlined"
                color="secondary"
                onClick={toggleCancelPlatformSignOpened}
              >
                Cancel
              </Button>
            </Stack>
          )}
          <Typography>
            Fee: <Sats amount={request?.fee} />
          </Typography>
          {request?.memo && (
            <Typography variant="body1">Memo: {request?.memo}</Typography>
          )}
          {request?.transaction?.source === BitcoinTransactionSource.App &&
            !request?.transaction?.error && (
              <Typography>
                Transaction broadcasting is in progress, please wait...
              </Typography>
            )}
          {request?.transaction?.error && (
            <Alert severity="error">{request?.transaction?.error}</Alert>
          )}
          <Box
            sx={{
              display: "grid",
              gridAutoColumns: "1fr",
              gridAutoFlow: ["row", "column"],
              gap: 2,
            }}
          >
            {!request?.transaction &&
              (satisfiesThreshold ? (
                <Button variant="contained" onClick={broadcast}>
                  Broadcast
                </Button>
              ) : (
                <>
                  {(!request?.signRequest || !request.signRequest.willSignAt) &&
                    request?.signedWithKeys.some(
                      (key) => key.ownershipType === KeyOwnershipType.User
                    ) && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={requestPlatformKeySign}
                      >
                        Sign with platform key
                      </Button>
                    )}
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={toggleUserSignOpened}
                  >
                    Sign with user key
                  </Button>
                </>
              ))}

            <Button
              variant="contained"
              color="secondary"
              onClick={toggleEditMemoOpened}
            >
              {request?.memo ? "Edit" : "Add"} memo
            </Button>

            {request?.psbt && <DownloadPSBT psbt={request?.psbt} />}

            <Button
              variant="outlined"
              color="secondary"
              onClick={toggleConfirmRemoveOpened}
            >
              Remove
            </Button>
          </Box>
        </Stack>
      )}
      {userSignOpened && request?.psbt && (
        <Dialog onClose={toggleUserSignOpened} title="Sign with user key">
          <SignPSBT
            psbt={request?.psbt}
            onPsbtSign={(signedPsbt) => {
              updateBitcoinPaymentRequest({
                variables: {
                  id: paymentRequestId,
                  psbt: signedPsbt,
                },
              });
              toggleUserSignOpened();
            }}
          />
        </Dialog>
      )}
      {platformSignOpened && platformKeySignRequest && (
        <Dialog
          onClose={togglePlatformSignOpened}
          title="Sign with platform key"
        >
          <PlatformKeySign
            signRequest={platformKeySignRequest}
            onSuccess={() => {
              togglePlatformSignOpened();
            }}
          />
        </Dialog>
      )}
      {cancelPlatformSignOpened && (
        <ConfirmationDialog
          prompt="Cancel plaform key sign request?"
          onClose={toggleCancelPlatformSignOpened}
          onConfirm={async () => {
            if (!request?.signRequest) {
              return;
            }
            await deletePlatformKeySignRequest({
              variables: {
                id: request.signRequest.id,
              },
            });
            toggleCancelPlatformSignOpened();
          }}
        />
      )}
      {confirmRemoveOpened && (
        <ConfirmationDialog
          prompt="Delete payment request?"
          onClose={toggleConfirmRemoveOpened}
          onConfirm={() =>
            removeBitcoinPaymentRequest({
              variables: {
                id: paymentRequestId,
              },
            })
          }
        />
      )}
      {editMemoOpened && (
        <TextDialog
          title="Edit memo"
          onClose={toggleEditMemoOpened}
          value={request?.memo ?? ""}
          onSave={async (value) => {
            await updateBitcoinPaymentRequest({
              variables: {
                id: paymentRequestId,
                memo: value,
              },
            });
          }}
        />
      )}
    </Stack>
  );
};

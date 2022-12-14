import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import PopupState from "material-ui-popup-state";
import { bindMenu, bindTrigger } from "material-ui-popup-state/hooks";
import { SignMessage } from "modules/key/import-key/SignMessage";
import { PlatformKey } from "modules/key/platform-key/PlatformKey";
import { Dialog } from "modules/shared/components/dialog/Dialog";
import { TooltippedMenuItem } from "modules/shared/components/tooltipped/TooltippedMenuItem";
import {
  CreatePlatformKeySignRequestMutation,
  GetWalletQuery,
  KeyOwnershipType,
  useCreatePlatformKeySignRequestMutation,
  useCreateSignMessageRequestMutation,
  useGetKeyLazyQuery,
  useGetPlatformKeyBillingQuery,
  useSignMessageMutation,
} from "modules/shared/graphql/client";
import { useToggle } from "modules/shared/hooks/useToggle";
import { FC, useState } from "react";
import { toast } from "react-hot-toast";
import { PlatformKeyVerify } from "./platform-key-verify/PlatformKeyVerify";
import { ViewKey } from "./view-key/ViewKey";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import { PlatformKeyEdit } from "./platform-key-edit/PlatformKeyEdit";
import { PlatformKeyBilling } from "./platform-key-billing/PlatformKeyBilling";

export const Key: FC<{
  data: NonNullable<GetWalletQuery["wallet"]["keys"][0]>;
  signedUserKeysCount: number;
  accountIndex: number;
}> = ({ data: key, signedUserKeysCount, accountIndex }) => {
  const [signMessageOpened, toggleSignMessage] = useToggle();
  const [platformKeyBillingOpen, togglePlatformKeyBillingOpen] = useToggle();
  const [platformKeyVerifyOpen, togglePlatformKeyVerifyOpen] = useToggle();
  const [platformKeyEditOpen, togglePlatformKeyEditOpen] = useToggle();
  const [keyViewOpen, toggleKeyViewOpen] = useToggle();
  const [signData, setSignData] = useState<{
    msg: string;
    derivationPath: string;
  } | null>(null);
  const [platformKeySignRequest, setPlatformKeySignRequest] =
    useState<
      CreatePlatformKeySignRequestMutation["createPlatformKeySignRequest"]
    >();
  const [fetchKey] = useGetKeyLazyQuery({
    variables: {
      keyId: key.id,
    },
  });

  const { data: platformKeyBillingData } = useGetPlatformKeyBillingQuery({
    variables: {
      keyId: key.id,
    },
    skip: key.ownershipType !== KeyOwnershipType.Platform,
  });

  const [
    createSignMessageRequest,
    { loading: createSignMessageRequestLoading },
  ] = useCreateSignMessageRequestMutation();
  const [signMessage] = useSignMessageMutation();

  const [
    createPlatformKeySignRequest,
    { loading: createPlatformKeySignRequestLoading },
  ] = useCreatePlatformKeySignRequestMutation();

  const onVerifyUserKey = async () => {
    const { data } = await createSignMessageRequest();
    if (!data?.createSignMessageRequest) {
      return;
    }

    setSignData({
      msg: data.createSignMessageRequest.id,
      derivationPath: data.createSignMessageRequest.derivationPath,
    });
    toggleSignMessage();
  };

  const onVerifyPlatformKey = async () => {
    const { data } = await createPlatformKeySignRequest({
      variables: {
        keyId: key.id,
      },
    });

    if (!data?.createPlatformKeySignRequest) {
      return;
    }

    setPlatformKeySignRequest(data.createPlatformKeySignRequest);
    togglePlatformKeyVerifyOpen();
  };

  const onMessageSign = async (signature: string) => {
    if (!signData) {
      return;
    }

    const result = await signMessage({
      variables: {
        msg: signData?.msg,
        signature,
        keyId: key.id,
      },
    });

    if (result.data?.signMessage) {
      toast.success("Key verified");
      fetchKey();
    }

    toggleSignMessage();
  };

  const isPlatformKey = key.ownershipType === KeyOwnershipType.Platform;

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" gap={1}>
          <VpnKeyIcon sx={{ color: "primary.main" }} />
          <Stack>
            <Typography variant="subtitle1">{key.name}</Typography>
            <Typography variant="caption">
              Verified {dayjs().to(key.lastVerifiedAt)}
            </Typography>
          </Stack>
          <Box flex={1} />

          {Boolean(key.signatures?.length) && (
            <Typography variant="caption" color="warning.main">
              Signed
            </Typography>
          )}
        </Stack>
      </CardContent>

      <CardActions sx={{ justifyContent: "end" }}>
        {platformKeyBillingData?.platformKeyBilling.paidUntil && (
          <Typography
            variant="caption"
            sx={{
              ml: 2,
              color: dayjs(
                platformKeyBillingData.platformKeyBilling.paidUntil
              ).isBefore(dayjs())
                ? "error.main"
                : undefined,
            }}
          >
            Paid until{" "}
            {dayjs(platformKeyBillingData.platformKeyBilling.paidUntil).format(
              "DD.MM.YYYY"
            )}
          </Typography>
        )}
        <Box flex={1} />
        <PopupState variant="popover" popupId="keyMenu">
          {(keyMenuState) => (
            <>
              <Button
                variant="outlined"
                color="secondary"
                endIcon={<KeyboardArrowDownIcon />}
                {...bindTrigger(keyMenuState)}
              >
                Actions
              </Button>
              <Menu {...bindMenu(keyMenuState)}>
                {isPlatformKey && (
                  <MenuItem
                    onClick={() => {
                      togglePlatformKeyBillingOpen();
                      keyMenuState.close();
                    }}
                  >
                    Billing
                  </MenuItem>
                )}
                <TooltippedMenuItem
                  onClick={() => {
                    toggleKeyViewOpen();
                    keyMenuState.close();
                  }}
                  disabled={
                    isPlatformKey
                      ? signedUserKeysCount < 2
                      : key.signatures?.length === 0
                  }
                  tooltip={
                    isPlatformKey
                      ? "You need to sign at least 2 user keys to view platform key"
                      : "You need to sign this key to view it"
                  }
                >
                  View
                </TooltippedMenuItem>
                <TooltippedMenuItem
                  onClick={() => {
                    if (isPlatformKey) {
                      onVerifyPlatformKey();
                    } else {
                      onVerifyUserKey();
                    }
                    keyMenuState.close();
                  }}
                  disabled={
                    createSignMessageRequestLoading ||
                    (isPlatformKey && signedUserKeysCount < 1)
                  }
                  tooltip={
                    isPlatformKey
                      ? "You need to sign at least 1 user key"
                      : undefined
                  }
                >
                  Verify
                </TooltippedMenuItem>
                {key.ownershipType === KeyOwnershipType.Platform && (
                  <TooltippedMenuItem
                    onClick={() => {
                      togglePlatformKeyEditOpen();
                      keyMenuState.close();
                    }}
                    disabled={isPlatformKey && signedUserKeysCount < 2}
                    tooltip="You need to sign at least 2 user keys to edit platform key"
                  >
                    Edit
                  </TooltippedMenuItem>
                )}
              </Menu>
            </>
          )}
        </PopupState>
      </CardActions>
      {signData && signMessageOpened && (
        <Dialog title="Sign message" onClose={toggleSignMessage}>
          <SignMessage
            messageToSign={signData.msg}
            messageToSignDerivationPath={signData.derivationPath}
            onMessageSign={onMessageSign}
          />
        </Dialog>
      )}
      {platformKeyBillingData && platformKeyBillingOpen && (
        <Dialog
          title="Platform key billing"
          onClose={togglePlatformKeyBillingOpen}
        >
          <PlatformKeyBilling
            platformKeyBilling={platformKeyBillingData.platformKeyBilling}
          />
        </Dialog>
      )}
      {platformKeySignRequest && platformKeyVerifyOpen && (
        <Dialog
          title="Verify platform key"
          onClose={togglePlatformKeyVerifyOpen}
        >
          <PlatformKeyVerify
            signRequest={platformKeySignRequest}
            onVerify={() => {
              toast.success("Key verified");
              fetchKey();
              togglePlatformKeyVerifyOpen();
            }}
          />
        </Dialog>
      )}
      {platformKeyEditOpen && (
        <Dialog title="Edit platform key" onClose={togglePlatformKeyEditOpen}>
          <PlatformKeyEdit
            keyId={key.id}
            onSuccess={togglePlatformKeyEditOpen}
          />
        </Dialog>
      )}
      {keyViewOpen && (
        <Dialog title="View key" onClose={toggleKeyViewOpen}>
          <ViewKey keyId={key.id} accountIndex={accountIndex} />
        </Dialog>
      )}
    </Card>
  );
};

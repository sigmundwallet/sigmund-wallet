import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DownloadIcon from "@mui/icons-material/Download";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios, { isAxiosError } from "axios";
import saveAs from "file-saver";
import { ImportKey } from "modules/key/import-key/ImportKey";
import { AccountData } from "modules/key/import-key/types";
import {
  PlatformKey,
  PlatformKeyData,
} from "modules/key/platform-key/PlatformKey";
import { Checkbox } from "modules/shared/components/checkbox/Checkbox";
import {
  CopyButton,
  CopyWrapper,
} from "modules/shared/components/copy-button/CopyButton";
import { Dialog } from "modules/shared/components/dialog/Dialog";
import { TextDialog } from "modules/shared/components/dialog/TextDialog";
import type { RecoveryInfoItem } from "modules/shared/graphql/schema/utils";
import { useMutation } from "modules/shared/hooks/useMutation";
import { useToggle } from "modules/shared/hooks/useToggle";
import { shorten } from "modules/shared/utils";
import { generateExportText } from "modules/shared/utils/generateExportText";
import NextLink from "next/link";
import type { VerifyEmailInput } from "pages/api/verify/email";
import type { CreateWalletInput } from "pages/api/wallet-auth/create";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import QRCode from "react-qr-code";

const getId = () => Math.random().toString(36).substr(2, 9);

const CreateWalletPage = () => {
  const [createdWallet, setCreatedWallet] = useState<{
    walletId: string;
    recoveryInfo: RecoveryInfoItem[];
  } | null>();
  const [isUserKeyOpen, toggleUserKeyOpen] = useToggle();
  const [isVerifyEmailOpen, toggleVerifyEmailOpen] = useToggle();
  const [userKeys, setUserWallets] = useState<AccountData[]>([]);
  const [platformKey, setPlatformKey] = useState<PlatformKeyData | null>(null);
  const [emailVerification, setEmailVerification] = useState<{
    email: string;
    verificationId: string;
  } | null>(null);

  const {
    formState: { errors },
    register,
    control,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      emails: [] as {
        tempId: string;
        value: string;
        verificationId?: string;
        verified?: boolean;
      }[],
      notifyOnSign: true,
      notifyOnSend: true,
      notifyOnReceive: true,
      notifyOnVerify: true,
      notifyOnPlatformKeySignRequest: true,
      notifyOnPlatformKeySign: true,
    },
  });

  const formValues = watch();

  const [createWallet] = useMutation(async (data: CreateWalletInput) => {
    const response = await axios.post("/api/wallet-auth/create", data);

    return response.data as {
      walletId: string;
      recoveryInfo: RecoveryInfoItem[];
    };
  });

  const [verifyEmail] = useMutation(async (data: VerifyEmailInput) => {
    try {
      const response = await axios.post("/api/verify/email", data);

      return response.data as {
        email: string;
        verificationId: string;
        verified?: boolean;
      };
    } catch (error) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data.error || error.message);
      }
      throw error;
    }
  });

  const handleImport = (account: AccountData) => {
    setUserWallets((prev) => [...prev, account]);
    toggleUserKeyOpen();
  };

  const handlePlatformKeySave = (platformKey: PlatformKeyData) => {
    setPlatformKey(platformKey);
  };

  const handleVerifyEmail = async (index: number) => {
    const email = formValues.emails[index].value;

    if (emailVerification?.email === email) {
      toggleVerifyEmailOpen();
      return;
    }

    const result = await verifyEmail({
      email,
      code: undefined,
      verificationId: undefined,
    });

    if (result) {
      setEmailVerification({
        email: result.email,
        verificationId: result.verificationId,
      });
      toggleVerifyEmailOpen();
    }
  };

  const handleCreateWallet = async () => {
    if (!platformKey || userKeys.length < 2) {
      return;
    }
    if (formValues.emails.some((email) => !email.verified)) {
      toast.error("Please verify all emails");
      return;
    }
    const emails = formValues.emails.map((email) => ({
      email: email.value,
      verificationId: email.verificationId!,
    }));
    try {
      const result = await createWallet({
        userKeys: userKeys.map((userKey) => ({
          ...userKey,
          userKeyVerificationId: "dummy-id",
        })),
        platformKeys: [platformKey],
        emails,
        notifyOnSign: formValues.notifyOnSign,
        notifyOnSend: formValues.notifyOnSend,
        notifyOnReceive: formValues.notifyOnReceive,
        notifyOnVerify: formValues.notifyOnVerify,
        notifyOnPlatformKeySignRequest:
          formValues.notifyOnPlatformKeySignRequest,
        notifyOnPlatformKeySign: formValues.notifyOnPlatformKeySign,
      });

      if (result) {
        setCreatedWallet(result);
      }
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const exportText = useMemo(() => {
    if (!createdWallet) {
      return "";
    }
    return generateExportText({
      walletId: createdWallet.walletId,
      accountName: "Main",
      recoveryInfo: createdWallet.recoveryInfo,
    });
  }, [createdWallet]);

  const handleDownload = () => {
    const blob = new Blob([exportText], {
      type: "text/plain;charset=utf-8",
    });

    saveAs(
      blob,
      `sigmund-wallet-${createdWallet?.walletId.substring(0, 8)}-0.txt`
    );
  };

  return (
    <Stack gap={2}>
      {createdWallet ? (
        <>
          <Typography variant="h2" textAlign="center">
            Wallet created!
          </Typography>
          <Stack>
            <Typography variant="subtitle1">Access code</Typography>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography>{createdWallet.walletId}</Typography>
              <CopyButton text={createdWallet.walletId} />
            </Stack>
          </Stack>
          <Alert severity="warning" variant="outlined">
            Access code is the only way to access your wallet. Please save it in
            a safe place like a password manager or at least write it down on a
            piece of paper. If the wallet is intended to be used by multiple
            people, please make sure that everyone has access to the access
            code.
          </Alert>

          <Typography variant="subtitle1">Recovery info</Typography>
          <Alert severity="warning" variant="outlined">
            Recovery info is used to recover your wallet in case you are unable
            to use Sigmund Wallet and platform key. This recovery info can be
            used directly in the BlueWallet mobile wallet or Sparrow desktop
            wallet. Please save it in a safe place like a password manager or
            write it down on a piece of paper. If the wallet is intended to be
            used by multiple people, please make sure that everyone has access
            to the recovery info. Note that the recovery info can&apos;t be used
            to steal your funds. But it can help adversaries to learn more about
            your wallet and your transactions. Also note that you&apos;ll be
            able to see the recovery info again on the wallet page when you sign
            with both of your keys.
          </Alert>
          <Stack gap={2} direction="row" alignItems="center" width="100%">
            <QRCode value={exportText} style={{ display: "block" }} />
            <TextField
              multiline
              rows="10"
              value={exportText}
              spellCheck={false}
              InputProps={{
                sx: { fontSize: "1rem" },
              }}
              sx={{ flex: 1 }}
            />
          </Stack>
          <Stack gap={2} direction="row" justifyContent="center">
            <CopyWrapper text={exportText}>
              {({ onClick }) => (
                <Button
                  variant="outlined"
                  onClick={onClick}
                  startIcon={<ContentCopyOutlinedIcon />}
                >
                  Copy
                </Button>
              )}
            </CopyWrapper>
            <Button
              variant="outlined"
              onClick={handleDownload}
              startIcon={<DownloadIcon />}
            >
              Download
            </Button>
          </Stack>
        </>
      ) : (
        <>
          <Typography variant="h3">Create 2-of-3 multisig wallet</Typography>
          <Link component={NextLink} href="/wallet/open">
            Open existing wallet
          </Link>
          <Paper sx={{ p: 4 }} variant="outlined">
            <Stack gap={2} alignItems="start">
              <Typography variant="h3">User Keys</Typography>
              {userKeys.map((wallet) => (
                <Card
                  variant="outlined"
                  key={wallet.xpub}
                  sx={{ width: "100%" }}
                >
                  <CardContent>
                    <Typography>{wallet.walletType}</Typography>
                    <Typography>{wallet.masterFingerprint}</Typography>
                    <Typography>{wallet.derivationPath}</Typography>
                    <Typography>{shorten(wallet.xpub, 6)}</Typography>
                  </CardContent>
                </Card>
              ))}
              {userKeys.length < 2 && (
                <Button
                  variant="contained"
                  type="submit"
                  onClick={toggleUserKeyOpen}
                >
                  Add key
                </Button>
              )}
            </Stack>
          </Paper>

          <Paper sx={{ p: 4 }} variant="outlined">
            <Stack gap={2} alignItems="start">
              <Typography variant="h3">Platform Key</Typography>
              <PlatformKey onSave={handlePlatformKeySave} />
            </Stack>
          </Paper>

          <Paper sx={{ p: 4 }} variant="outlined">
            <Stack gap={2} alignItems="start">
              {/* TODO Temporary turned off until email service is found */}
              {/* <Typography variant="subtitle1">Notifications</Typography>
              {formValues.emails.map((email, index) => (
                <Stack
                  key={email.tempId}
                  direction="row"
                  alignItems="center"
                  gap={2}
                  sx={{ width: "100%" }}
                >
                  <TextField
                    placeholder="E-Mail"
                    {...register(`emails.${index}.value`)}
                    disabled={email.verified}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => handleVerifyEmail(index)}
                    disabled={email.verified}
                  >
                    {email.verified ? "Verified" : "Verify"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setValue(
                        "emails",
                        formValues.emails.filter(
                          (e) => e.tempId !== email.tempId
                        )
                      );
                    }}
                  >
                    Remove
                  </Button>
                </Stack>
              ))}
              {formValues.emails.length < 2 && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    const emails = formValues.emails;
                    if (emails.length >= 2) return;
                    emails.push({ tempId: getId(), value: "" });
                    setValue("emails", emails);
                  }}
                >
                  Add E-Mail
                </Button>
              )}
              {Boolean(formValues.emails.length) ? (
                <Stack>
                  <Checkbox
                    control={control}
                    name="notifyOnSign"
                    label="Notify on sign-in"
                  />
                  <Checkbox
                    control={control}
                    name="notifyOnSend"
                    label="Notify when funds are sent"
                  />
                  <Checkbox
                    control={control}
                    name="notifyOnReceive"
                    label="Notify when funds are received"
                  />
                  <Checkbox
                    control={control}
                    name="notifyOnVerify"
                    label="Notify on key verification required"
                  />
                  <Checkbox
                    control={control}
                    name="notifyOnPlatformKeySignRequest"
                    label="Notify on platform key signature request"
                  />
                  <Checkbox
                    control={control}
                    name="notifyOnPlatformKeySign"
                    label="Notify on successful platform key signature"
                  />
                </Stack>
              ) : (
                <Alert severity="warning" variant="outlined">
                  For enhanced security and ease of use, it is highly
                  recommended to provide an email address for notifications.
                  Your email will only be used for receiving notifications and
                  will not be shared with any third-party entities. Furthermore,
                  having an email address enables additional security features,
                  such as the ability to request an emergency access code
                  replacement.
                </Alert>
              )} */}
              {platformKey && userKeys.length === 2 && (
                <Button
                  variant="contained"
                  type="submit"
                  onClick={handleCreateWallet}
                >
                  Create wallet
                </Button>
              )}
            </Stack>
          </Paper>
          {isUserKeyOpen && (
            <Dialog title="Import Key" onClose={toggleUserKeyOpen}>
              <ImportKey onImport={handleImport} />
            </Dialog>
          )}
          {isVerifyEmailOpen && emailVerification && (
            <TextDialog
              title="Verify E-Mail"
              onClose={toggleVerifyEmailOpen}
              onSave={async (value) => {
                await verifyEmail({
                  code: value.trim(),
                  email: emailVerification.email,
                  verificationId: emailVerification.verificationId,
                });
                const index = formValues.emails.findIndex(
                  (e) => e.value === emailVerification.email
                );
                if (index >= 0) {
                  setValue(`emails.${index}.verified`, true);
                  setValue(
                    `emails.${index}.verificationId`,
                    emailVerification.verificationId
                  );
                  setEmailVerification(null);
                }
                toggleVerifyEmailOpen();
              }}
              prompt={`Please enter the verification code that was sent to ${emailVerification.email}.`}
            />
          )}
        </>
      )}
    </Stack>
  );
};

export default CreateWalletPage;

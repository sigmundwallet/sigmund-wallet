import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {
  Button,
  FormHelperText,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios, { isAxiosError } from "axios";
import { SignMessage } from "modules/key/import-key/SignMessage";
import { Dialog } from "modules/shared/components/dialog/Dialog";
import { useToggle } from "modules/shared/hooks/useToggle";
import { FormValues } from "modules/shared/utils/types";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useForm } from "react-hook-form";

const WalletSignin = () => {
  const [signMessageOpened, toggleSignMessage] = useToggle();
  const [showPassword, toggleShowPassword] = useToggle(false);
  const { register, handleSubmit, formState, watch } = useForm({
    defaultValues: { walletId: "", password: "" },
    mode: "onChange",
  });
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [signData, setSignData] = useState<{
    msg: string;
    derivationPath: string;
  } | null>(null);
  const [lastSignature, setLastSignature] = useState<string | null>();

  const values = watch();

  const onMessageSign = (signature: string) => {
    setLastSignature(signature);
    handleSignIn({
      ...values,
      signature,
    });
    toggleSignMessage();
  };

  const handleSignIn = async ({
    walletId,
    signature,
  }: FormValues<typeof handleSubmit> & {
    signature?: string;
  }) => {
    setSubmitError(null);

    const signatureData = signature
      ? JSON.stringify({
          msg: signData?.msg,
          derivationPath: signData?.derivationPath,
          signature,
        })
      : null;

    try {
      const resp = await axios("/api/wallet-auth/signin", {
        method: "POST",
        data: {
          walletId,
          signature: signatureData,
        },
      });

      router.replace(`/wallet/${walletId}`);
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.response?.data.sign) {
          setSignData(error.response?.data.sign);
        }
        setSubmitError(error.response?.data.error ?? error.message);
      }
    }
  };

  const onSubmit = async (values: FormValues<typeof handleSubmit>) => {
    if (lastSignature) {
      handleSignIn({ ...values, signature: lastSignature });
    } else {
      handleSignIn(values);
    }
  };

  return (
    <Stack alignItems="center">
      <Stack gap={2} sx={{ maxWidth: ["auto", "60%"], width: "100%" }}>
        <Typography variant="h3">Open wallet</Typography>
        <Stack component="form" onSubmit={handleSubmit(onSubmit)} gap={2}>
          <TextField
            label="Access code"
            type={showPassword ? "text" : "password"}
            {...register("walletId", { required: true })}
            error={Boolean(formState.errors.walletId)}
            autoComplete="off"
            helperText={formState.errors.walletId && "Access code is required"}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={toggleShowPassword}
                    onMouseDown={toggleShowPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {submitError && <FormHelperText error>{submitError}</FormHelperText>}
          {signData ? (
            <Button variant="contained" onClick={toggleSignMessage}>
              Sign with hardware wallet
            </Button>
          ) : (
            <Button variant="contained" type="submit">
              Sign in
            </Button>
          )}
          <Link
            component={NextLink}
            href="/wallet/create"
            color="secondary.main"
          >
            Create wallet
          </Link>
        </Stack>
      </Stack>
      {signData && signMessageOpened && (
        <Dialog title="Sign message" onClose={toggleSignMessage}>
          <SignMessage
            messageToSign={signData.msg}
            messageToSignDerivationPath={signData.derivationPath}
            onMessageSign={onMessageSign}
          />
        </Dialog>
      )}
    </Stack>
  );
};

export default WalletSignin;

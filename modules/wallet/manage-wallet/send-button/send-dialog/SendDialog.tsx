import {
  Button,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Dialog, DialogProps } from "modules/shared/components/dialog/Dialog";
import {
  CreateBitcoinPaymentRequestMutation,
  useCreateBitcoinPaymentRequestMutation,
  useGetBitcoinChainInfoQuery,
} from "modules/shared/graphql/client";
import { FormValues } from "modules/shared/utils/types";
import { FC, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

export type SendDialogProps = {
  walletId: string;
  accountIndex: number;
  currentBalance: number;
  onCreate(
    paymentRequest: CreateBitcoinPaymentRequestMutation["createBitcoinPaymentRequest"]
  ): void;
};

export const SendDialog: FC<SendDialogProps & DialogProps> = ({
  walletId,
  accountIndex,
  currentBalance,
  onCreate,
  ...props
}) => {
  const { register, handleSubmit, formState, reset, setValue } = useForm({
    defaultValues: { address: "", amount: 0, fee: 1 },
    mode: "onChange",
  });

  const [feeToggleValue, setFeeToggleValue] = useState(1);
  const handleFeeToggle = (_: any, newValue: number) => {
    if (!newValue) return;
    setFeeToggleValue(newValue);
    if (newValue > 0) {
      setValue("fee", newValue);
    }
  };

  const { data: bitcoinChainInfoData, loading: bitcoinChainInfoLoading } =
    useGetBitcoinChainInfoQuery();
  const feeRates = useMemo(
    () => bitcoinChainInfoData?.bitcoinChainInfo?.feeRates ?? [],
    [bitcoinChainInfoData]
  );

  useEffect(() => {
    if (feeRates.length > 0) {
      setFeeToggleValue(feeRates[2]);
      setValue("fee", feeRates[2]);
    }
  }, [feeRates, setValue]);

  const [
    createBitcoinPaymentRequest,
    { data: bitcoinPaymentRequestData, loading: bitcoinPaymentRequestLoading },
  ] = useCreateBitcoinPaymentRequestMutation();

  const onSubmit = async (values: FormValues<typeof handleSubmit>) => {
    const result = await createBitcoinPaymentRequest({
      variables: {
        address: values.address,
        amount: Number(values.amount),
        feeRate: Number(values.fee),
        maxOut: Number(values.amount) === currentBalance,
        walletId,
        accountIndex,
      },
    });

    if (result.data?.createBitcoinPaymentRequest) {
      props.onClose?.();
      onCreate?.(result.data?.createBitcoinPaymentRequest);
    }
  };

  const setMaxAmount = () => {
    setValue("amount", currentBalance);
  };

  return (
    <Dialog title="Send Bitcoin" {...props}>
      <Stack
        gap={2}
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ minWidth: { xs: "auto", sm: 600 } }}
      >
        <TextField
          label="Address"
          {...register("address", { required: "Address is required" })}
          error={!!formState.errors.address}
          helperText={formState.errors.address?.message}
        />
        <TextField
          label="Amount"
          {...register("amount", { required: "Amount is required" })}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Button onClick={setMaxAmount}>MAX</Button>
              </InputAdornment>
            ),
          }}
          error={!!formState.errors.amount}
          helperText={formState.errors.amount?.message}
        />
        {bitcoinChainInfoData && (
          <ToggleButtonGroup
            value={feeToggleValue}
            exclusive
            onChange={handleFeeToggle}
            fullWidth
          >
            <ToggleButton value={feeRates[4]}>
              Slow ({feeRates[4]} sats/vbyte)
            </ToggleButton>
            <ToggleButton value={feeRates[2]}>
              Medium ({feeRates[2]} sats/vbyte)
            </ToggleButton>
            <ToggleButton value={feeRates[0]}>
              Fast ({feeRates[0]} sats/vbyte)
            </ToggleButton>
            <ToggleButton value={-1}>Custom</ToggleButton>
          </ToggleButtonGroup>
        )}
        {feeToggleValue < 0 && (
          <TextField
            label="Custom Fee"
            {...register("fee", { required: true })}
          />
        )}
        <Button
          variant="contained"
          type="submit"
          //   disabled={updateUserBitcoinKeyLoading}
        >
          Send
        </Button>

        {bitcoinPaymentRequestData && (
          <TextField
            value={bitcoinPaymentRequestData.createBitcoinPaymentRequest.psbt}
          />
        )}
      </Stack>
    </Dialog>
  );
};

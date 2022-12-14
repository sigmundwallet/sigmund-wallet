import { Button, Stack, TextField } from "@mui/material";
import {
  GetBitcoinPaymentRequestQuery,
  PlatformKeyVerificationType,
  useConfirmPlatformKeySignRequestMutation,
} from "modules/shared/graphql/client";
import { FormValues } from "modules/shared/utils/types";
import { FC } from "react";
import { useForm } from "react-hook-form";

export const PlatformKeySign: FC<{
  signRequest: NonNullable<
    GetBitcoinPaymentRequestQuery["bitcoinPaymentRequest"]["signRequest"]
  >;
  onSuccess: () => void;
}> = ({ signRequest, onSuccess }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
  } = useForm({
    defaultValues: {
      quizAnswers: [] as string[],
      email: "",
      confirmationTime: 7,
    },
  });

  const [
    confirmPlatformKeySignRequest,
    { loading: confirmLoading },
  ] = useConfirmPlatformKeySignRequestMutation();

  const onSubmit = async (data: FormValues<typeof handleSubmit>) => {
    const verification = [];

    if (
      signRequest.platformKey.verificationType ===
      PlatformKeyVerificationType.Quiz
    ) {
      verification.push(...data.quizAnswers);
    }

    const result = await confirmPlatformKeySignRequest({
      variables: {
        id: signRequest.id,
        verification,
      },
    });

    if (result.data?.confirmPlatformKeySignRequest) {
      onSuccess();
    }
  };

  return (
    <Stack component="form" gap={2} onSubmit={handleSubmit(onSubmit)}>
      {signRequest.platformKey.verificationType ===
        PlatformKeyVerificationType.Quiz &&
        signRequest.platformKey.quizQuestions &&
        signRequest.platformKey.quizQuestions.map((question, index) => (
          <TextField
            key={question}
            label={question}
            {...register(`quizAnswers.${index}`)}
          />
        ))}
      <Button variant="contained" type="submit">
        Confirm
      </Button>
    </Stack>
  );
};

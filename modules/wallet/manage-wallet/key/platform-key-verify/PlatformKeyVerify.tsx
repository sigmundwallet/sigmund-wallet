import { Button, Stack, TextField } from "@mui/material";
import {
  CreatePlatformKeySignRequestMutation,
  GetBitcoinPaymentRequestQuery,
  PlatformKeyVerificationType,
  useConfirmPlatformKeySignRequestMutation,
} from "modules/shared/graphql/client";
import { FormValues } from "modules/shared/utils/types";
import { FC } from "react";
import { useForm } from "react-hook-form";

export const PlatformKeyVerify: FC<{
  signRequest: NonNullable<
    CreatePlatformKeySignRequestMutation["createPlatformKeySignRequest"]
  >;
  onVerify: () => void;
}> = ({ signRequest, onVerify }) => {
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
      onVerify();
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

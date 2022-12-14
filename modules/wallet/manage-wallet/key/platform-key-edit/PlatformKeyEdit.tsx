import { Button, Paper, Stack, Typography } from "@mui/material";
import {
  PlatformKey,
  PlatformKeyData,
} from "modules/key/platform-key/PlatformKey";
import { useUpdatePlatformKeyMutation } from "modules/shared/graphql/client";
import { FC, useState } from "react";
import { toast } from "react-hot-toast";

export const PlatformKeyEdit: FC<{ keyId: string; onSuccess(): void }> = ({
  keyId,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [keyData, setKeyData] = useState<PlatformKeyData>();

  const [updatePlatformKey, { loading }] = useUpdatePlatformKeyMutation();

  const onConfirm = async () => {
    if (!keyData) {
      return;
    }
    await updatePlatformKey({
      variables: {
        input: {
          keyId,
          quizQuestions: keyData.quizQuestions,
          quizAnswers: keyData.quizAnswers,
          verificationPediod: keyData.confirmationTime,
        },
      },
    });
    toast.success("Platform key updated");
    onSuccess();
  };

  return (
    <>
      {currentStep === 0 && (
        <PlatformKey
          initialData={keyData}
          onSave={(values) => {
            console.log(values);
            setKeyData(values);
            setCurrentStep(1);
          }}
          disableEditSwitch
        />
      )}
      {currentStep === 1 && (
        <Stack gap={2}>
          <Typography>
            Are you sure you want to replace platform key&apos;s verification
            the following data?
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            {keyData?.quizQuestions.map((question, index) => (
              <Stack key={index}>
                <Typography>
                  {index + 1}. {question}
                </Typography>
                <Typography pl={4}>{keyData.quizAnswers[index]}</Typography>
              </Stack>
            ))}
          </Paper>
          <Stack gap={2} direction="row">
            <Button
              color="secondary"
              variant="outlined"
              onClick={onConfirm}
              disabled={loading}
              fullWidth
            >
              Confirm
            </Button>
            <Button
              color="primary"
              variant="contained"
              onClick={() => {
                setCurrentStep(0);
              }}
              fullWidth
            >
              Back
            </Button>
          </Stack>
        </Stack>
      )}
    </>
  );
};

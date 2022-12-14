import { yupResolver } from "@hookform/resolvers/yup";
import {
  Button,
  Divider,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  NativeSelect,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { PlatformKeyVerificationType } from "modules/shared/graphql/client";
import { FormValues } from "modules/shared/utils/types";
import { FC, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";
import { couple, single } from "./questions";

export type PlatformKeyData = {
  confirmationType: PlatformKeyVerificationType;
  quizType: "single" | "couple";
  quizQuestions: string[];
  quizAnswers: string[];
  email?: string;
  confirmationTime: number;
};

const schema = yup
  .object()
  .shape({
    confirmationType: yup.string().required(),
    quizQuestions: yup.array().when("confirmationType", {
      is: "QUIZ",
      then: yup
        .array()
        .of(yup.string().required().not([undefined]))
        .required()
        .test("uniqueQuestions", "Questions must be unique", (questions) =>
          questions ? questions.length === new Set(questions).size : false
        ),
    }),
    quizAnswers: yup.array().when("confirmationType", {
      is: "QUIZ",
      then: yup
        .array()
        .of(yup.string().required().not([undefined]))
        .min(3, "Must have at least 3 answers")
        .required(),
    }),
    confirmationTimeInDays: yup
      .number()
      .min(1, "Must be at least 1 day")
      .max(30, "Must be at most 30 days")
      .required(),
  })
  .required();

export const PlatformKey: FC<{
  initialData?: Partial<PlatformKeyData>;
  onSave: (platformKey: PlatformKeyData) => void;
  disableEditSwitch?: boolean;
}> = ({ initialData, onSave, disableEditSwitch = false }) => {
  const [editMode, setEditMode] = useState(disableEditSwitch);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      confirmationType: PlatformKeyVerificationType.Quiz,
      quizType: "single" as PlatformKeyData["quizType"],
      quizQuestions: [single[0], single[0], single[0]] as string[],
      quizAnswers: [] as string[],
      email: "",
      confirmationTimeInDays: 7, // 1 week in seconds
      ...initialData,
    },
    resolver: yupResolver(schema),
  });

  const values = watch();
  const confirmationType = watch("confirmationType");
  const quizType = watch("quizType");

  const questions = quizType === "single" ? single : couple;

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (name === "quizType") {
        setValue("quizQuestions", [questions[0], questions[0], questions[0]]);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, questions, setValue]);

  const onSubmit = (data: FormValues<typeof handleSubmit>) => {
    onSave({
      confirmationType: data.confirmationType,
      quizType: data.quizType,
      quizQuestions: data.quizQuestions,
      quizAnswers: data.quizAnswers,
      email: data.email,
      confirmationTime: dayjs
        .duration(data.confirmationTimeInDays, "days")
        .asSeconds(),
    });
    if (!disableEditSwitch) {
      setEditMode(false);
    }
  };

  return editMode ? (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} gap={2}>
      {/* <>
        {" "}
        <Controller
          name="confirmationType"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Confirmation type</InputLabel>
              <Select
                value={field.value}
                label="Confirmation type"
                onChange={field.onChange}
              >
                <MenuItem value={PlatformKeyVerificationType.Quiz}>
                  Quiz
                </MenuItem>
                <MenuItem value={PlatformKeyVerificationType.Email}>
                  E-Mail
                </MenuItem>
                <MenuItem value={PlatformKeyVerificationType.Sms}>
                  Telegram
                </MenuItem>
              </Select>
            </FormControl>
          )}
        />
        <Divider />
      </> */}
      {confirmationType === PlatformKeyVerificationType.Quiz && (
        <>
          <Controller
            name="quizType"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Quiz</InputLabel>
                <Select
                  value={field.value}
                  label="Quiz"
                  onChange={field.onChange}
                >
                  <MenuItem value="single">Single person</MenuItem>
                  <MenuItem value="couple">Couple</MenuItem>
                </Select>
              </FormControl>
            )}
          />
          {Array.from({ length: 3 }).map((_, index) => (
            <Stack key={index} gap={2}>
              <Controller
                name={`quizQuestions.${index}`}
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Question {index + 1}</InputLabel>
                    <NativeSelect value={field.value} onChange={field.onChange}>
                      {questions.map((question) => (
                        <option key={question} value={question}>
                          {question}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormControl>
                )}
              />
              <TextField
                label={`Answer ${index + 1}`}
                {...register(`quizAnswers.${index}`, {})}
              />
            </Stack>
          ))}
        </>
      )}
      {confirmationType === PlatformKeyVerificationType.Email && (
        <>
          <TextField label="E-Mail" {...register("email")} />
        </>
      )}
      <Divider />
      <TextField
        label="Delay after confirmation (days)"
        type="number"
        {...register("confirmationTimeInDays", { valueAsNumber: true })}
      />
      <Divider />

      {Object.entries(errors).map(([key, error]) => (
        <FormHelperText key={key + error} error>
          {error.message}
        </FormHelperText>
      ))}

      <Button variant="contained" type="submit">
        Save
      </Button>
    </Stack>
  ) : (
    <Stack gap={2}>
      {values.quizAnswers.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          {values?.quizQuestions.map((question, index) => (
            <Stack key={index}>
              <Typography>
                {index + 1}. {question}
              </Typography>
              <Typography pl={4}>{values.quizAnswers[index]}</Typography>
            </Stack>
          ))}
        </Paper>
      )}
      <Button variant="contained" onClick={() => setEditMode(true)}>
        Edit
      </Button>
    </Stack>
  );
};

import {
  Checkbox as MuiCheckbox,
  CheckboxProps,
  FormControlLabel,
} from "@mui/material";
import { Control, Controller, Path, useFormContext } from "react-hook-form";

export const Checkbox = <T extends Record<string, any>>({
  name,
  value,
  label,
  control,
  onChange: onChangeCallback,
  ...restProps
}: {
  name: Path<T>;
  value?: any;
  label?: string;
  control: Control<T>;
  onChange?: VoidFunction;
} & CheckboxProps) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value: currentValue, onChange, ...field } }) => {
        return (
          <FormControlLabel
            control={
              <MuiCheckbox
                {...field}
                checked={
                  Array.isArray(currentValue)
                    ? currentValue.includes(value)
                    : currentValue
                }
                value={value}
                onChange={(_e, checked) => {
                  if (!Array.isArray(currentValue)) {
                    onChange(checked);
                    onChangeCallback?.();
                    return;
                  }

                  const set = new Set(currentValue);
                  if (checked) {
                    set.add(value);
                  } else {
                    set.delete(value);
                  }
                  onChange(Array.from(set));
                  onChangeCallback?.();
                }}
                sx={{ color: "text.primary" }}
                {...restProps}
              />
            }
            label={label ?? value}
          />
        );
      }}
    />
  );
};

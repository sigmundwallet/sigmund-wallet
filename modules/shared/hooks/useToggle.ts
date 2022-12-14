import { useState } from "react";

export const useToggle = (defaultValue = false) => {
  const [bool, setBool] = useState(defaultValue);

  return [bool, () => setBool(!bool)] as const;
};

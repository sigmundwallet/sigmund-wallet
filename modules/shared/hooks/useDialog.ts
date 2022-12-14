import { createContext, useContext } from "react";

const DialogContext = createContext<{
  close: () => void;
}>({
  close: () => {},
});

export const DialogProvider = DialogContext.Provider;

export const useDialog = () => {
  const context = useContext(DialogContext);

  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }

  return context;
};

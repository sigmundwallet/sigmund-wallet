import {
  TooltippedButton,
  TooltippedButtonProps,
} from "modules/shared/components/tooltipped/TooltippedButton";
import { useToggle } from "modules/shared/hooks/useToggle";
import { FC } from "react";
import { SendDialog, SendDialogProps } from "./send-dialog/SendDialog";

export type SendButtonProps = SendDialogProps &
  Omit<TooltippedButtonProps, "onClick">;

export const SendButton: FC<SendButtonProps> = ({
  walletId,
  accountIndex,
  onCreate,
  currentBalance,
  ...props
}) => {
  const [open, toggleOpen] = useToggle();

  return (
    <>
      <TooltippedButton {...props} onClick={toggleOpen} />
      {open && (
        <SendDialog
          {...{ walletId, onCreate, currentBalance, accountIndex }}
          onClose={toggleOpen}
        />
      )}
    </>
  );
};

import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import {
  IconButton,
  IconButtonProps,
  Tooltip,
  TooltipProps,
} from "@mui/material";
import copy from "copy-to-clipboard";
import { FC, useCallback, useState } from "react";

export const CopyButton: FC<
  {
    text: string;
    tooltipTitle?: string;
    onCopyTooltipTitle?: string;
    tooltipPlacement?: TooltipProps["placement"];
  } & IconButtonProps
> = ({
  text,
  tooltipTitle = "Copy",
  tooltipPlacement = "top",
  onCopyTooltipTitle = "Copied",
  ...props
}) => {
  const [isCopying, setIsCopying] = useState(false);

  const handleClick = useCallback(() => {
    copy(text);
    setIsCopying(true);
  }, [text]);

  return (
    <IconButton onClick={handleClick} {...props}>
      <Tooltip
        title={isCopying ? onCopyTooltipTitle : tooltipTitle}
        leaveDelay={1000}
        placement={tooltipPlacement}
        onClose={() => setIsCopying(false)}
        arrow
      >
        <ContentCopyOutlinedIcon sx={{ height: "0.75em" }} />
      </Tooltip>
    </IconButton>
  );
};

export const CopyWrapper: FC<{
  text: string;
  tooltipTitle?: string;
  onCopyTooltipTitle?: string;
  tooltipPlacement?: TooltipProps["placement"];
  children: ({ onClick }: { onClick: () => void }) => JSX.Element;
}> = ({
  text,
  tooltipTitle,
  tooltipPlacement = "top",
  onCopyTooltipTitle = "Copied",
  ...props
}) => {
  const [isCopying, setIsCopying] = useState(false);

  const handleClick = useCallback(() => {
    copy(text);
    setIsCopying(true);
  }, [text]);

  return (
    <Tooltip
      title={isCopying ? onCopyTooltipTitle : tooltipTitle}
      leaveDelay={1000}
      placement={tooltipPlacement}
      onClose={() => setIsCopying(false)}
      arrow
    >
      {props.children({ onClick: handleClick })}
    </Tooltip>
  );
};

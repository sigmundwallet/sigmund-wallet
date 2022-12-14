import { CryptoPSBT } from "@keystonehq/bc-ur-registry";
import { Button, Stack, Typography } from "@mui/material";
import { QrCode } from "modules/shared/components/qr-code/QrCode";
import { useToggle } from "modules/shared/hooks/useToggle";
import dynamic from "next/dynamic";
import { FC, useEffect, useMemo, useState } from "react";
import { BaseHardwareKeyProps } from "../types";

const DynamicQrScanner = dynamic(
  () =>
    import("modules/shared/components/qr-scanner/QrScanner").then(
      (mod) => mod.QrScanner
    ),
  {
    loading: () => <div>Loading...</div>,
    ssr: false,
  }
);

const PsbtQRCode = ({ psbt }: { psbt: string }) => {
  const [currentQrValue, setCurrentQrValue] = useState<string | undefined>();

  const ur = useMemo(() => {
    if (!psbt) return;

    const cryptoPSBT = new CryptoPSBT(Buffer.from(psbt, "base64"));
    const ur = cryptoPSBT.toUREncoder(50);

    setCurrentQrValue(ur.nextPart());

    return ur;
  }, [psbt]);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextPart = ur?.nextPart();
      setCurrentQrValue(nextPart);
    }, 200);

    return () => clearTimeout(timer);
  }, [ur]);

  return currentQrValue ? (
    <Stack alignItems="center">
      <QrCode value={currentQrValue} />
    </Stack>
  ) : null;
};

export const AirgappedSignPSBT: FC<BaseHardwareKeyProps> = ({
  psbt,
  onPsbtSign,
}) => {
  const [showPsbt, toggleShowPsbt] = useToggle(true);

  return (
    <Stack gap={2}>
      <Typography variant="h5">Airgapped Sign PSBT</Typography>
      {showPsbt && psbt ? (
        <PsbtQRCode psbt={psbt} />
      ) : (
        <DynamicQrScanner
          onResult={(result) => {
            if (result.type === "psbt") {
              onPsbtSign?.(result.psbt);
            }
          }}
        />
      )}
      <Button variant="contained" onClick={toggleShowPsbt}>
        {showPsbt ? "Scan signed PSBT" : "Show PSBT"}
      </Button>
    </Stack>
  );
};

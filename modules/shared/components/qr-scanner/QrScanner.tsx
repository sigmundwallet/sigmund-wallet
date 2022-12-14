import {
  CryptoAccount,
  CryptoHDKey,
  CryptoPSBT,
  URRegistryDecoder,
} from "@keystonehq/bc-ur-registry";
import { Box } from "@mui/material";
import QrScannerLib from "qr-scanner";
import { FC, useEffect, useRef, useState } from "react";

export type ScannerResult =
  | {
      type: "psbt";
      psbt: string;
    }
  | {
      type: "account";
      xpub: string;
      derivationPath: string;
      masterFingerprint: string;
    }
  | {
      type: "unknown";
      data: string;
    };

export const QrScanner: FC<{
  onResult?(result: ScannerResult): void;
}> = ({ onResult }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanProgress, setScanProgress] = useState<number>(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const decoder = new URRegistryDecoder();

    const qrScanner = new QrScannerLib(
      video,
      (result) => {
        if (result.data.startsWith("UR") || result.data.startsWith("ur")) {
          decoder.receivePart(result.data);
          setScanProgress(Math.round(decoder.estimatedPercentComplete() * 100));
          if (decoder.isComplete()) {
            const decoded = decoder.resultRegistryType();
            if (decoded instanceof CryptoPSBT) {
              onResult?.({
                type: "psbt",
                psbt: decoded.getPSBT().toString("base64"),
              });
            } else if (decoded instanceof CryptoAccount) {
              const hdKey = decoded.getOutputDescriptors()[0].getCryptoKey();
              if (hdKey instanceof CryptoHDKey) {
                onResult?.({
                  type: "account",
                  xpub: hdKey.getBip32Key(),
                  derivationPath: "m/" + hdKey.getOrigin().getPath(),
                  masterFingerprint: hdKey
                    .getOrigin()
                    .getSourceFingerprint()
                    .toString("hex"),
                });
              }
            }
          }
        } else {
          const accountMatch = result.data.match(/^\[(.{8})\/(.*)\](.pub.*)$/);
          if (accountMatch) {
            const [, masterFingerprint, derivationPath, xpub] = accountMatch;
            onResult?.({
              type: "account",
              xpub,
              derivationPath: "m/" + derivationPath,
              masterFingerprint,
            });
          } else {
            onResult?.({
              type: "unknown",
              data: result.data,
            });
          }
        }
      },
      { highlightScanRegion: true, highlightCodeOutline: true }
    );
    qrScanner.start();

    return () => {
      qrScanner.stop();
    };
  }, [videoRef]);

  return (
    <>
      <video ref={videoRef}></video>
      {scanProgress > 0 && (
        <div>
          <div>Scan progress: {scanProgress}%</div>
          <div>
            <progress value={scanProgress} max="100"></progress>
          </div>
        </div>
      )}
    </>
  );
};

export default QrScanner;

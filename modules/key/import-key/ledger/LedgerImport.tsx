import { pathStringToArray } from "@ledgerhq/hw-app-btc/lib/bip32";
import { AppClient } from "@ledgerhq/hw-app-btc/lib/newops/appClient";
import { PsbtV2 } from "@ledgerhq/hw-app-btc/lib/newops/psbtv2";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import { Button, FormHelperText, Stack, Typography } from "@mui/material";
import { Psbt } from "bitcoinjs-lib";
import { FC, useCallback, useEffect, useRef, useState } from "react";
import { BaseHardwareKeyProps } from "../types";
import { SuperchargedAppClient } from "./app-client/AppClient";
import { AddressType, MultisigWallet } from "./app-client/WalletPolicy";
import bs58 from "bs58check";
import { segwitMultisigPath } from "modules/shared/utils";

const derivationPath = segwitMultisigPath();

const LedgerImport: FC<BaseHardwareKeyProps> = ({
  mode,
  onImport,
  psbt,
  onPsbtSign,
  onMessageSign,
  messageToSign,
  messageToSignDerivationPath,
}) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const wasMountedOnce = useRef(false);

  const tryImportKey = useCallback(async () => {
    try {
      setError("");
      setLoading(true);

      const transport = await TransportWebUSB.create();

      const appClient = new AppClient(transport);

      const xpub = await appClient.getExtendedPubkey(
        false,
        pathStringToArray(derivationPath)
      );

      const masterFingerprint = await appClient.getMasterFingerprint();

      if (xpub && masterFingerprint) {
        onImport?.({
          xpub,
          derivationPath,
          masterFingerprint: masterFingerprint.toString("hex"),
          walletType: "ledger",
        });
      }
    } catch (error) {
      setError((error as Error).message);
    }
    setLoading(false);
  }, [onImport]);

  const trySignPsbt = useCallback(async () => {
    try {
      setError("");
      setLoading(true);

      if (!psbt) {
        throw new Error("PSBT is missing");
      }

      const psbtToSign = Psbt.fromBase64(psbt);

      const xpubs = psbtToSign.data.globalMap.globalXpub?.map((xpub) => {
        const masterFingerprint = xpub.masterFingerprint.toString("hex");
        const derivationPath = xpub.path.substring(1);
        const xpubBase58 = bs58.encode(xpub.extendedPubkey);
        return `[${masterFingerprint}${derivationPath}]${xpubBase58}`;
      });

      if (!xpubs) {
        throw new Error("No xpubs found in PSBT");
      }

      const transport = await TransportWebUSB.create();

      const appClient = new SuperchargedAppClient(transport);

      const masterFingerprint = await appClient.getMasterFingerprint();

      const walletPolicy = new MultisigWallet(
        "Sigmund 2 of 3",
        AddressType.WIT,
        2,
        xpubs
      );

      const walletResult = await appClient.registerWallet(walletPolicy);
      const walletHMAC = walletResult.subarray(32, 64);

      const ledgerPsbt = new PsbtV2();

      ledgerPsbt.setGlobalFallbackLocktime(0);
      ledgerPsbt.setGlobalPsbtVersion(2);
      ledgerPsbt.setGlobalTxVersion(2);
      ledgerPsbt.setGlobalInputCount(psbtToSign.data.inputs.length);
      ledgerPsbt.setGlobalOutputCount(psbtToSign.data.outputs.length);
      ledgerPsbt.deserialize(Buffer.from(psbt, "base64"));

      psbtToSign.data.inputs.forEach((input, index) => {
        const inputData = psbtToSign.txInputs[index];
        ledgerPsbt.setInputPreviousTxId(index, inputData.hash);
        ledgerPsbt.setInputOutputIndex(index, inputData.index);
      });

      psbtToSign.data.outputs.forEach((output, index) => {
        const outputData = psbtToSign.txOutputs[index];
        ledgerPsbt.setOutputAmount(index, outputData.value);
        ledgerPsbt.setOutputScript(index, outputData.script);
      });

      const result = await appClient.signPsbt(
        ledgerPsbt,
        walletPolicy,
        walletHMAC,
        () => {}
      );

      for (let [inputIndex, signature] of Array.from(result)) {
        const psbtInput = psbtToSign.data.inputs[inputIndex];
        const pubkey = psbtInput.bip32Derivation?.find((derivation) =>
          derivation.masterFingerprint.equals(masterFingerprint)
        )?.pubkey;

        if (!pubkey) {
          throw new Error("No pubkey found");
        }

        psbtInput.partialSig = psbtInput.partialSig || [];
        psbtInput.partialSig.push({
          pubkey,
          signature,
        });
      }

      onPsbtSign?.(psbtToSign.toBase64());
    } catch (error) {
      console.log(error);
      setError((error as Error).message);
    }
    setLoading(false);
  }, [psbt, onPsbtSign]);

  const trySignMessage = useCallback(async () => {
    try {
      setError("");
      setLoading(true);

      if (!messageToSign || !messageToSignDerivationPath) {
        throw new Error("Message to sign or derivation path is missing");
      }

      const transport = await TransportWebUSB.create();

      const appClient = new SuperchargedAppClient(transport);

      const signatureBase64 = await appClient.signMessage(
        Buffer.from(messageToSign),
        messageToSignDerivationPath
      );
      const signature = Buffer.from(signatureBase64, "base64").toString("hex");

      onMessageSign?.(signature);
    } catch (error) {
      setError((error as Error).message);
    }
    setLoading(false);
  }, [messageToSign, messageToSignDerivationPath, onMessageSign]);

  useEffect(() => {
    if (wasMountedOnce.current) {
      return;
    }
    wasMountedOnce.current = true;

    if (mode === "sign-message") {
      trySignMessage();
    } else if (mode === "import") {
      tryImportKey();
    } else if (mode === "sign-psbt") {
      trySignPsbt();
    }
  }, [tryImportKey, trySignMessage, trySignPsbt, mode]);

  return (
    <Stack gap={2}>
      <Typography variant="h5">Ledger Import</Typography>
      {error && (
        <>
          <FormHelperText error>{error}</FormHelperText>
          <Button variant="contained" onClick={tryImportKey}>
            Try again
          </Button>
        </>
      )}
    </Stack>
  );
};
export default LedgerImport;

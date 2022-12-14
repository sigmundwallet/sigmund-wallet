import { BIP32API, BIP32Factory } from "bip32";
import * as bitcoin from "bitcoinjs-lib";
import base58 from "bs58check";
import { randomBytes } from "crypto";
import { ECPairFactory } from "ecpair";
import * as ecc from "tiny-secp256k1";
import { convertXprv, convertXpub } from "./utils/convert";
import { magicHash } from "bitcoinjs-message";
import { segwitMultisigPath } from "../../utils";

const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);

export class BitcoinProvider {
  bip32: BIP32API;
  segwitMultisigPath: string;
  isTestnet: boolean;

  constructor(public network: bitcoin.Network) {
    this.bip32 = BIP32Factory(ecc);
    this.segwitMultisigPath = segwitMultisigPath(
      0,
      network !== bitcoin.networks.bitcoin
    );
    this.isTestnet = network !== bitcoin.networks.bitcoin;
  }

  getScriptHash(address: string) {
    return bitcoin.crypto
      .sha256(bitcoin.address.toOutputScript(address, this.network))
      .reverse()
      .toString("hex");
  }

  parseOutputScript(script: Buffer) {
    const scripthash = bitcoin.crypto.sha256(script).reverse().toString("hex");

    let address: string | undefined;

    try {
      address = bitcoin.payments.p2sh({
        output: script,
        network: this.network,
      }).address;
      return { address, scripthash };
    } catch (error) {}

    try {
      address = bitcoin.payments.p2wpkh({
        output: script,
        network: this.network,
      }).address;
      return { address, scripthash };
    } catch (error) {}

    try {
      address = bitcoin.payments.p2wsh({
        output: script,
        network: this.network,
      }).address;
      return { address, scripthash };
    } catch (error) {}

    return {
      address,
      scripthash,
    };
  }

  getAccountDerivationPath(accountIndex = 0) {
    return segwitMultisigPath(
      accountIndex,
      this.network !== bitcoin.networks.bitcoin
    );
  }

  /*
   * Returns the public key of the given private key at the given account index
   */
  deriveAccount(privateKey: string, accountIndex = 0) {
    return this.bip32
      .fromBase58(
        convertXprv(
          privateKey,
          this.network === bitcoin.networks.bitcoin ? "xprv" : "tprv"
        ),
        this.network
      )
      .derivePath(this.getAccountDerivationPath(accountIndex))
      .neutered()
      .toBase58();
  }

  getXKeyLetter() {
    return this.network === bitcoin.networks.bitcoin
      ? "Z"
      : this.network === bitcoin.networks.testnet
      ? "V"
      : "t";
  }

  generatePrivateKey() {
    const derivationPath = this.segwitMultisigPath;
    const node = this.bip32.fromSeed(randomBytes(32), this.network);
    const hdPrivateKey = node.toBase58();
    const hdPublicKey = node.derivePath(derivationPath).neutered().toBase58();

    const letter = this.getXKeyLetter();
    return {
      hdPrivateKey: convertXprv(hdPrivateKey, `${letter}prv`),
      hdPublicKey: convertXpub(hdPublicKey, `${letter}pub`),
      masterFingerprint: node.fingerprint.toString("hex"),
      derivationPath,
    };
  }

  createAddress(hdPublicKey: string, index = 0, change = false) {
    const pubkey = this.bip32
      .fromBase58(
        convertXpub(
          hdPublicKey,
          this.network === bitcoin.networks.bitcoin ? "xpub" : "tpub"
        ),
        this.network
      )
      .derivePath(`${change ? 1 : 0}/${index}`).publicKey;

    const { address } = bitcoin.payments.p2wpkh({
      pubkey,
      network: this.network,
    });

    return address;
  }

  createMultisigAddress(keys: string[], index = 0, change = false) {
    const pubkeys = keys
      .map((key) =>
        convertXpub(
          key,
          this.network === bitcoin.networks.bitcoin ? "xpub" : "tpub"
        )
      )
      .map(
        (publicKey) =>
          this.bip32
            .fromBase58(publicKey, this.network)
            .derivePath(`${change ? 1 : 0}/${index}`).publicKey
      )
      .map((pubkey) => pubkey.toString("hex"))
      .sort()
      .map((hex) => Buffer.from(hex, "hex"));

    const { address } = bitcoin.payments.p2wsh({
      redeem: bitcoin.payments.p2ms({
        m: 2,
        pubkeys: pubkeys,
        network: this.network,
      }),
    });

    return address;
  }

  convertFromBase58(
    keys: {
      publicKey: string;
      privateKey: string | null;
      derivationPath: string;
      masterFingerprint: string | null;
    }[],
    accountIndex: number
  ) {
    return keys
      .map((key) => {
        const derivationPath = key.privateKey
          ? segwitMultisigPath(
              accountIndex,
              this.network !== bitcoin.networks.bitcoin
            )
          : key.derivationPath;

        const privateKey = key.privateKey
          ? convertXprv(
              key.privateKey,
              this.network === bitcoin.networks.bitcoin ? "xprv" : "tprv"
            )
          : undefined;

        const privateNode = privateKey
          ? this.bip32
              .fromBase58(privateKey, this.network)
              .derivePath(derivationPath)
          : undefined;

        const publicKey = privateNode
          ? privateNode.neutered().toBase58()
          : convertXpub(
              key.publicKey,
              this.network === bitcoin.networks.bitcoin ? "xpub" : "tpub"
            );

        const fingerprint = key.masterFingerprint
          ? Buffer.from(key.masterFingerprint, "hex")
          : privateNode
          ? privateNode.fingerprint
          : Buffer.from("00000000", "hex");

        const publicNode = this.bip32.fromBase58(publicKey, this.network);

        const extendedPubkey = Buffer.from(
          base58.decode(publicNode.neutered().toBase58()).slice(0, 78)
        );

        return {
          publicKey: Buffer.from(publicKey, "hex"),
          publicNode,
          derivationPath,
          extendedPubkey,
          privateKey,
          fingerprint,
        };
      })
      .sort((a, b) => a.publicKey.compare(b.publicKey));
  }

  generatePSBT(args: {
    inputs: {
      txId: string;
      vout: number;
      derivationPath: string;
      txData: string;
    }[];
    outputs: {
      address: string;
      value: number;
      derivationPath?: string;
    }[];
    keys: {
      publicKey: string;
      privateKey: string | null;
      derivationPath: string;
      masterFingerprint: string | null;
    }[];
    accountIndex: number;
  }) {
    const psbt = new bitcoin.Psbt({ network: this.network });

    const convertedKeys = this.convertFromBase58(args.keys, args.accountIndex);

    psbt.updateGlobal({
      globalXpub: convertedKeys
        .map(({ extendedPubkey, fingerprint, derivationPath }) => ({
          extendedPubkey,
          masterFingerprint: fingerprint,
          path: derivationPath,
        }))
        .sort((a, b) => a.extendedPubkey.compare(b.extendedPubkey)),
    });

    for (const { address, value, derivationPath } of args.outputs) {
      const additionalFields = derivationPath
        ? (() => {
            const keys = convertedKeys
              .map((key) => ({
                ...key,
                publicKey: key.publicNode.derivePath(derivationPath).publicKey,
              }))
              .sort((a, b) => a.publicKey.compare(b.publicKey));
            const pubkeys = keys.map(({ publicKey }) => publicKey);

            const payment = bitcoin.payments.p2wsh({
              redeem: bitcoin.payments.p2ms({
                m: 2,
                pubkeys,
                network: this.network,
              }),
            });

            console.log({ add: payment.address, address });

            const bip32Derivation = keys
              .map(
                ({ derivationPath: parentPath, publicKey, fingerprint }) => ({
                  pubkey: publicKey,
                  masterFingerprint: fingerprint,
                  path: `${parentPath}/${derivationPath}`,
                })
              )
              .sort((a, b) => a.pubkey.compare(b.pubkey));

            return {
              bip32Derivation,
              witnessScript: payment.redeem?.output,
            };
          })()
        : {};

      psbt.addOutput({
        address,
        value,
        ...additionalFields,
      });
    }

    for (const { txId, vout, derivationPath, txData } of args.inputs) {
      const keys = convertedKeys
        .map((key) => ({
          ...key,
          publicKey: key.publicNode.derivePath(derivationPath).publicKey,
        }))
        .sort((a, b) => a.publicKey.compare(b.publicKey));
      const pubkeys = keys.map(({ publicKey }) => publicKey);

      const payment = bitcoin.payments.p2wsh({
        redeem: bitcoin.payments.p2ms({
          m: 2,
          pubkeys,
          network: this.network,
        }),
      });

      psbt.addInput({
        hash: txId,
        index: vout,
        witnessScript: payment.redeem?.output,
        witnessUtxo: bitcoin.Transaction.fromHex(txData).outs[vout],
        nonWitnessUtxo: Buffer.from(txData, "hex"),
        bip32Derivation: keys
          .map(({ derivationPath: parentPath, publicKey, fingerprint }) => ({
            pubkey: publicKey,
            masterFingerprint: fingerprint,
            path: `${parentPath}/${derivationPath}`,
          }))
          .sort((a, b) => a.pubkey.compare(b.pubkey)),
        sighashType: bitcoin.Transaction.SIGHASH_ALL,
      });
    }

    return psbt.toBase64();
  }

  validatePSBT({
    origPSBTEncoded,
    currentPSBTEncoded,
    newPSBTEncoded,
  }: {
    origPSBTEncoded: string;
    currentPSBTEncoded: string;
    newPSBTEncoded: string;
  }) {
    const origPsbt = bitcoin.Psbt.fromBase64(origPSBTEncoded);
    const currentPsbt = bitcoin.Psbt.fromBase64(currentPSBTEncoded);
    const newPsbt = bitcoin.Psbt.fromBase64(newPSBTEncoded);

    if (
      currentPsbt.data.inputs.some(
        (input) => input.finalScriptSig || input.finalScriptWitness
      )
    ) {
      throw new Error("Current PSBT is already signed and cannot be modified");
    }

    const origTx = bitcoin.Transaction.fromBuffer(
      origPsbt.data.getTransaction()
    );
    const newTx = bitcoin.Transaction.fromBuffer(newPsbt.data.getTransaction());

    if (origTx.getId() !== newTx.getId()) {
      throw new Error(
        `Transaction ID mismatch, original: ${origTx.getId()}, new: ${newTx.getId()}`
      );
    }

    const partiallySignedCount = newPsbt.data.inputs.filter(
      (input) =>
        input.partialSig?.length &&
        !(Boolean(input.finalScriptSig) || Boolean(input.finalScriptWitness))
    ).length;
    const finalSignedCount = newPsbt.data.inputs.filter(
      (input) =>
        !input.partialSig?.length &&
        (Boolean(input.finalScriptSig) || Boolean(input.finalScriptWitness))
    ).length;
    const maxSignedCount = Math.max(partiallySignedCount, finalSignedCount);
    if (maxSignedCount !== newPsbt.data.inputs.length) {
      throw new Error("Not all inputs are signed");
    }

    const inputMasterFingerprints = newPsbt.data.inputs.map((input, index) => {
      const hashToSign = this.getHashToSign(origPsbt, index);
      if (!hashToSign) {
        throw new Error("Cannot get hash to sign");
      }

      const originalBip32Derivation =
        origPsbt.data.inputs[index].bip32Derivation;

      if (!originalBip32Derivation) {
        throw new Error(`No bip32Derivation for input ${index}`);
      }

      const signedDerivations: typeof input.bip32Derivation = [];
      if (input.finalScriptWitness) {
        const signatures = splitBuffer(
          input.finalScriptWitness.subarray(1)
        ).slice(1, 3);

        originalBip32Derivation.forEach((derivation) => {
          const keyPair = ECPair.fromPublicKey(derivation.pubkey);
          const witnessSignature = signatures.find((wrappedSignature) => {
            const { signature } =
              bitcoin.script.signature.decode(wrappedSignature);
            return keyPair.verify(hashToSign, signature);
          });
          if (witnessSignature) {
            signedDerivations.push(derivation);
          }
        });
      } else if (input.partialSig) {
        for (const partialSigItem of input.partialSig) {
          const keyPair = ECPair.fromPublicKey(partialSigItem.pubkey);
          const { signature } = bitcoin.script.signature.decode(
            partialSigItem.signature
          );
          if (keyPair.verify(hashToSign, signature)) {
            signedDerivations.push(
              originalBip32Derivation.find((derivation) =>
                derivation.pubkey.equals(partialSigItem.pubkey)
              )!
            );
          }
        }
      }

      return signedDerivations
        .map((derivation) => derivation.masterFingerprint)
        .sort((a, b) => a.compare(b))
        .map((fingerprint) => fingerprint.toString("hex"));
    });

    if (!inputMasterFingerprints.length) {
      throw new Error("No master fingerprints of signed inputs found");
    }

    if (
      inputMasterFingerprints
        .map((items) => items.join())
        .some(
          (fingerprints) => fingerprints !== inputMasterFingerprints[0].join()
        )
    ) {
      throw new Error("Master fingerprints mismatch");
    }

    const updatedPsbt = origPsbt.combine(newPsbt);

    return {
      masterFingerprint: inputMasterFingerprints[0],
      updatedPSBT: updatedPsbt.toBase64(),
    };
  }

  signPSBT({
    psbt: psbtBase64,
    privateKey,
  }: {
    psbt: string;
    privateKey: string;
    dryRun?: boolean;
  }) {
    let psbt = bitcoin.Psbt.fromBase64(psbtBase64);
    const node = bip32.fromBase58(
      convertXprv(
        privateKey,
        this.network === bitcoin.networks.bitcoin ? "xprv" : "tprv"
      ),
      this.network
    );
    for (const [input, index] of psbt.data.inputs.map(
      (input, index) => [input, index] as const
    )) {
      if (input.finalScriptSig || input.finalScriptWitness) {
        throw new Error("PSBT is already signed");
      }

      if (!input.partialSig?.length) {
        throw new Error("PSBT is not partially signed");
      }

      const keyDerivation = input.bip32Derivation?.find((derivation) =>
        node.derivePath(derivation.path).publicKey.equals(derivation.pubkey)
      );

      if (keyDerivation) {
        const keyPair = node.derivePath(keyDerivation.path);
        psbt.signInput(index, keyPair);
      }
    }

    try {
      psbt.finalizeAllInputs();
    } catch {}

    return psbt.toBase64();
  }

  extractTransaction(psbt: string) {
    const psbtObject = bitcoin.Psbt.fromBase64(psbt);

    try {
      psbtObject.finalizeAllInputs();
    } catch {}

    return psbtObject.extractTransaction();
  }

  getHashToSign(psbt: bitcoin.Psbt, index: number) {
    let result: Buffer | undefined;
    const decoyKey = psbt.data.inputs[index].bip32Derivation?.[0].pubkey;
    if (!decoyKey) throw new Error(`No bip32Derivation for input ${index}`);
    const keyPair = {
      publicKey: decoyKey,
      sign: (hash: Buffer) => {
        result = hash;
        return Buffer.alloc(0);
      },
    };
    try {
      psbt.signInput(index, keyPair);
    } catch {}
    return result;
  }

  getScriptLength(address: string) {
    return bitcoin.address.toOutputScript(address, this.network).length;
  }

  static verifySignedMessage({
    message,
    signature,
    xpub,
    derivationSubPath,
  }: {
    message: string;
    signature: string;
    xpub: string;
    derivationSubPath: string;
  }) {
    const keyPair = ECPair.fromPublicKey(
      bip32.fromBase58(convertXpub(xpub, "xpub")).derivePath(derivationSubPath)
        .publicKey
    );

    const sigBuffer = Buffer.from(signature, "hex").subarray(1);
    const mshHash = magicHash(message);

    return keyPair.verify(mshHash, sigBuffer);
  }
}

function splitBuffer(buffer: Buffer) {
  const result: Buffer[] = [];
  let offset = 0;
  while (offset < buffer.length) {
    const length = buffer.readUInt8(offset);
    offset += 1;
    result.push(buffer.subarray(offset, offset + length));
    offset += length;
  }
  return result;
}

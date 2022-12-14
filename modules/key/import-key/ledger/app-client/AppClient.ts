import {
  pathElementsToBuffer,
  pathStringToArray,
} from "@ledgerhq/hw-app-btc/lib/bip32";
import { BufferWriter } from "@ledgerhq/hw-app-btc/lib/buffertools";
import { AppClient } from "@ledgerhq/hw-app-btc/lib/newops/appClient";
import { ClientCommandInterpreter } from "@ledgerhq/hw-app-btc/lib/newops/clientCommands";
import { hashLeaf, Merkle } from "@ledgerhq/hw-app-btc/lib/newops/merkle";
import { createVarint } from "@ledgerhq/hw-app-btc/lib/varint";
import { MerkelizedPsbt } from "@ledgerhq/hw-app-btc/lib/newops/merkelizedPsbt";
import { WalletPolicy } from "./WalletPolicy";
import { PsbtV2 } from "@ledgerhq/hw-app-btc/lib/newops/psbtv2";

const CLA_BTC = 0xe1;
const CLA_FRAMEWORK = 0xf8;

enum BitcoinIns {
  GET_PUBKEY = 0x00,
  // GET_ADDRESS = 0x01, // Removed from app
  REGISTER_WALLET = 0x02,
  GET_WALLET_ADDRESS = 0x03,
  SIGN_PSBT = 0x04,
  GET_MASTER_FINGERPRINT = 0x05,
  SIGN_MESSAGE = 0x10,
}

enum FrameworkIns {
  CONTINUE_INTERRUPTED = 0x01,
}

export class SuperchargedAppClient extends AppClient {
  async publicMakeRequest(
    ins: BitcoinIns,
    data: Buffer,
    cci?: ClientCommandInterpreter
  ): Promise<Buffer> {
    let response: Buffer = await this.transport.send(
      CLA_BTC,
      ins,
      0,
      0,
      data,
      [0x9000, 0xe000]
    );
    while (response.readUInt16BE(response.length - 2) === 0xe000) {
      if (!cci) {
        throw new Error("Unexpected SW_INTERRUPTED_EXECUTION");
      }

      const hwRequest = response.slice(0, -2);
      const commandResponse = cci.execute(hwRequest);

      response = await this.transport.send(
        CLA_FRAMEWORK,
        FrameworkIns.CONTINUE_INTERRUPTED,
        0,
        0,
        commandResponse,
        [0x9000, 0xe000]
      );
    }
    return response.slice(0, -2); // drop the status word (can only be 0x9000 at this point)
  }

  async registerWallet(walletPolicy: WalletPolicy) {
    const clientInterpreter = new ClientCommandInterpreter(() => {});
    clientInterpreter.addKnownPreimage(walletPolicy.serialize());
    clientInterpreter.addKnownList(
      walletPolicy.keys.map((k) => Buffer.from(k, "ascii"))
    );
    clientInterpreter.addKnownPreimage(
      Buffer.from(walletPolicy.descriptorTemplate, "ascii")
    );

    const serialized = walletPolicy.serialize();

    const buf = new BufferWriter();
    buf.writeVarSlice(serialized);

    const response = await this.publicMakeRequest(
      BitcoinIns.REGISTER_WALLET,
      buf.buffer(),
      clientInterpreter
    );

    return response;
  }

  async signPsbt(
    psbt: PsbtV2,
    walletPolicy: WalletPolicy,
    walletHMAC: Buffer | null,
    progressCallback: () => void
  ): Promise<Map<number, Buffer>> {
    const merkelizedPsbt = new MerkelizedPsbt(psbt);

    if (walletHMAC != null && walletHMAC.length != 32) {
      throw new Error("Invalid HMAC length");
    }

    const clientInterpreter = new ClientCommandInterpreter(progressCallback);

    // prepare ClientCommandInterpreter
    clientInterpreter.addKnownList(
      walletPolicy.keys.map((k) => Buffer.from(k, "ascii"))
    );
    clientInterpreter.addKnownPreimage(walletPolicy.serialize());
    clientInterpreter.addKnownPreimage(
      Buffer.from(walletPolicy.descriptorTemplate, "ascii")
    );

    clientInterpreter.addKnownMapping(merkelizedPsbt.globalMerkleMap);
    for (const map of merkelizedPsbt.inputMerkleMaps) {
      clientInterpreter.addKnownMapping(map);
    }
    for (const map of merkelizedPsbt.outputMerkleMaps) {
      clientInterpreter.addKnownMapping(map);
    }

    clientInterpreter.addKnownList(merkelizedPsbt.inputMapCommitments);
    const inputMapsRoot = new Merkle(
      merkelizedPsbt.inputMapCommitments.map((m) => hashLeaf(m))
    ).getRoot();
    clientInterpreter.addKnownList(merkelizedPsbt.outputMapCommitments);
    const outputMapsRoot = new Merkle(
      merkelizedPsbt.outputMapCommitments.map((m) => hashLeaf(m))
    ).getRoot();

    await this.publicMakeRequest(
      BitcoinIns.SIGN_PSBT,
      Buffer.concat([
        merkelizedPsbt.getGlobalKeysValuesRoot(),
        createVarint(merkelizedPsbt.getGlobalInputCount()),
        inputMapsRoot,
        createVarint(merkelizedPsbt.getGlobalOutputCount()),
        outputMapsRoot,
        walletPolicy.getWalletId(),
        walletHMAC || Buffer.alloc(32, 0),
      ]),
      clientInterpreter
    );

    const yielded = clientInterpreter.getYielded();

    const ret: Map<number, Buffer> = new Map();
    for (const inputAndSig of yielded) {
      ret.set(inputAndSig[0], inputAndSig.slice(1));
    }
    return ret;
  }

  async signMessage(message: Buffer, path: string): Promise<string> {
    const pathElements = pathStringToArray(path);

    const clientInterpreter = new ClientCommandInterpreter(() => {});

    // prepare ClientCommandInterpreter
    const nChunks = Math.ceil(message.length / 64);
    const chunks: Buffer[] = [];
    for (let i = 0; i < nChunks; i++) {
      chunks.push(message.subarray(64 * i, 64 * i + 64));
    }

    clientInterpreter.addKnownList(chunks);
    const chunksRoot = new Merkle(chunks.map((m) => hashLeaf(m))).getRoot();

    const buf = new BufferWriter();
    buf.writeSlice(pathElementsToBuffer(pathElements));
    buf.writeVarInt(message.length);
    buf.writeSlice(chunksRoot);

    const result = await this.publicMakeRequest(
      BitcoinIns.SIGN_MESSAGE,
      buf.buffer(),
      clientInterpreter
    );

    return result.toString("base64");
  }
}

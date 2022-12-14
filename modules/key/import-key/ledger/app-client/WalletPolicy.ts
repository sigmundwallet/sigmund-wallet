import { crypto } from "bitcoinjs-lib";
import {} from "@ledgerhq/hw-app-btc/lib/newops/policy";
import { BufferWriter } from "@ledgerhq/hw-app-btc/lib/buffertools";
import { hashLeaf, Merkle } from "@ledgerhq/hw-app-btc/lib/newops/merkle";

export enum WalletType {
  WALLET_POLICY_V1 = 1,
  WALLET_POLICY_V2 = 2,
}

export enum AddressType {
  LEGACY = 1, //: Legacy address type. P2PKH for single sig, P2SH for scripts.
  WIT = 2, //: Native segwit v0 address type. P2WPKH for single sig, P2WPSH for scripts.
  SH_WIT = 3, //: Nested segwit v0 address type. P2SH-P2WPKH for single sig, P2SH-P2WPSH for scripts.
  TAP = 4, //: Segwit v1 Taproot address type. P2TR always.
}

export class WalletPolicyBase {
  name: string;
  version: WalletType;

  constructor(name: string, version: WalletType) {
    this.name = name;
    this.version = version;

    if (
      version !== WalletType.WALLET_POLICY_V1 &&
      version !== WalletType.WALLET_POLICY_V2
    ) {
      throw new Error("Invalid wallet policy version");
    }
  }

  serialize(): Buffer {
    return Buffer.concat([
      Buffer.from([this.version]),
      this.serializeStr(this.name),
    ]);
  }

  get id(): Buffer {
    return crypto.sha256(this.serialize());
  }

  getWalletId() {
    return this.id;
  }

  protected serializeStr(value: string): Buffer {
    return Buffer.concat([
      Buffer.from([value.length]),
      Buffer.from(value, "latin1"),
    ]);
  }
}

export class WalletPolicy extends WalletPolicyBase {
  descriptorTemplate: string;
  keys: string[];
  /**
   * Represents a wallet stored with a wallet policy.
   * For version V2, the wallet is serialized as follows:
   *    - 1 byte   : wallet version
   *    - 1 byte   : length of the wallet name (max 64)
   *    - (var)    : wallet name (ASCII string)
   *    - (varint) : length of the descriptor template
   *    - 32-bytes : sha256 hash of the descriptor template
   *    - (varint) : number of keys (not larger than 252)
   *    - 32-bytes : root of the Merkle tree of all the keys information.
   *
   * The specific format of the keys is deferred to subclasses.
   */
  constructor(
    name: string,
    descriptor_template: string,
    keys_info: string[],
    version: WalletType = WalletType.WALLET_POLICY_V2
  ) {
    super(name, version);
    this.descriptorTemplate = descriptor_template;
    this.keys = keys_info;
  }

  get n_keys(): number {
    return this.keys.length;
  }

  serialize(): Buffer {
    const keyBuffers = this.keys.map((k) => {
      return Buffer.from(k, "ascii");
    });
    const m = new Merkle(keyBuffers.map((k) => hashLeaf(k)));

    const buf = new BufferWriter();
    buf.writeSlice(super.serialize());
    buf.writeVarInt(this.descriptorTemplate.length);
    if (this.version === WalletType.WALLET_POLICY_V2) {
      buf.writeSlice(crypto.sha256(Buffer.from(this.descriptorTemplate)));
    } else {
      buf.writeSlice(Buffer.from(this.descriptorTemplate, "ascii"));
    }
    buf.writeVarInt(this.keys.length);
    buf.writeSlice(m.getRoot());
    return buf.buffer();
  }

  get_descriptor(change: boolean): string {
    let desc = this.descriptorTemplate;
    for (let i = this.n_keys - 1; i >= 0; i--) {
      const key = this.keys[i];
      desc = desc.replace(`@${i}`, key);
    }
    // in V1, /** is part of the key; in V2, it's part of the policy map. This handles either
    desc = desc.replace("/**", `/${change ? 1 : 0}/*`);
    if (this.version === WalletType.WALLET_POLICY_V2) {
      // V2, the /<M;N> syntax is supported. Replace with M if not change, or with N if change
      const regex = /\/<(\d+);(\d+)>/;
      desc = desc.replace(regex, change ? "/$2" : "/$1");
    }
    return desc;
  }
}

export class MultisigWallet extends WalletPolicy {
  threshold: number;

  constructor(
    name: string,
    addressType: AddressType,
    threshold: number,
    keysInfo: string[],
    sorted: boolean = true,
    version: WalletType = WalletType.WALLET_POLICY_V2
  ) {
    const nKeys = keysInfo.length;
    if (1 > threshold || threshold > nKeys || nKeys > 16) {
      throw new Error("Invalid threshold or number of keys");
    }
    const multisigOp = sorted ? "sortedmulti" : "multi";
    let policyPrefix;
    let policySuffix;
    if (addressType == AddressType.LEGACY) {
      policyPrefix = `sh(${multisigOp}(`;
      policySuffix = "))";
    } else if (addressType == AddressType.WIT) {
      policyPrefix = `wsh(${multisigOp}(`;
      policySuffix = "))";
    } else if (addressType == AddressType.SH_WIT) {
      policyPrefix = `sh(wsh(${multisigOp}(`;
      policySuffix = ")))";
    } else {
      throw new Error(`Unexpected address type: ${addressType}`);
    }
    const keyPlaceholderSuffix =
      version == WalletType.WALLET_POLICY_V2 ? "/**" : "";
    const descriptorTemplate =
      policyPrefix +
      threshold +
      "," +
      keysInfo.map((keyInfo, k) => `@${k}${keyPlaceholderSuffix}`).join(",") +
      policySuffix;
    super(name, descriptorTemplate, keysInfo, version);
    this.threshold = threshold;
  }
}

export interface BlockchainInfo {
  chain: string;
  blocks: number;
  headers: number;
  bestblockhash: string;
  difficulty: number;
  mediantime: number;
  verificationprogress: number;
  initialblockdownload: boolean;
  chainwork: string;
  size_on_disk: number;
  pruned: boolean;
  pruneheight: number;
  automatic_pruning: boolean;
  prune_target_size: number;
  softforks: SoftFork[];
  bip9_softforks: Bip9SoftFork[];
}

export interface SoftFork {
  id: string;
  version: number;
  reject: Record<string, unknown>;
}

export interface Bip9SoftFork {
  status: string;
  bit: number;
  startTime: number;
  timeout: number;
  since: number;
}

export interface Block<Verbosity extends 1 | 2> {
  hash: string;
  confirmations: number;
  size: number;
  height: number;
  version: number;
  versionHex: string;
  merkleroot: string;
  tx: Verbosity extends 1
    ? string[]
    : Verbosity extends 2
    ? RawTransaction[]
    : never;
  time: number;
  mediantime: number;
  nonce: number;
  bits: string;
  difficulty: number;
  chainwork: string;
  previousblockhash: string;
  nextblockhash: string;
}

export interface BlockHeader {
  hash: string;
  confirmations: number;
  height: number;
  version: number;
  versionHex: string;
  merkleroot: string;
  time: number;
  mediantime: number;
  nonce: number;
  bits: string;
  difficulty: number;
  chainwork: string;
  previousblockhash: string;
  nextblockhash: string;
}

export interface ChainTip {
  height: number;
  hash: string;
  branchlen: number;
  status: string;
}

export interface MemPoolInfo {
  size: number;
  bytes: number;
  usage: number;
  maxmempool: number;
  mempoolminfee: number;
  minrelaytxfee: number;
}

export interface MemPool {
  [txid: string]: MemPoolTransaction;
}

export interface MemPoolTransaction {
  size: number;
  fee: number;
  modifiedfee: number;
  time: number;
  height: number;
  startingpriority: number;
  currentpriority: number;
  descendantcount: number;
  descendantsize: number;
  descendantfees: number;
  ancestorcount: number;
  ancestorsize: number;
  ancestorfees: number;
  wtxid: string;
  depends: string[];
}

export interface TxIn {
  txid: string;
  vout: number;
  scriptSig: {
    asm: string;
    hex: string;
  };
  sequence: number;
  txinwitness?: string[];
}

export interface TxOut {
  value: number;
  n: number;
  scriptPubKey: {
    asm: string;
    hex: string;
    reqSigs: number;
    type: string;
    addresses: string[];
  };
}

export interface RawTransaction {
  hex: string;
  txid: string;
  hash: string;
  size: number;
  version: number;
  locktime: number;
  vin: TxIn[];
  vout: TxOut[];
}

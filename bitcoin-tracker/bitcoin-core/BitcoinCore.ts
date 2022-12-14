import axios, { AxiosError, isAxiosError } from "axios";
import {
  Block,
  BlockchainInfo,
  BlockHeader,
  ChainTip,
  MemPool,
  MemPoolInfo,
  RawTransaction,
  TxOut,
} from "./types";

const BITCOIN_RPC_URL = `http://${process.env.BITCOIN_CORE_RPC_HOST}:${process.env.BITCOIN_CORE_RPC_PORT}`;

export class BitcoinCore {
  // Create an axios instance for making RPC requests.
  private bitcoinRpc = axios.create({
    baseURL: BITCOIN_RPC_URL,
    auth: {
      username: process.env.BITCOIN_CORE_RPC_USER ?? "",
      password: process.env.BITCOIN_CORE_RPC_PASSWORD ?? "",
    },
  });

  // A utility function for generating Bitcoin RPC request payloads.
  private createRpcRequest = (method: string, params: any[] = []) => ({
    jsonrpc: "2.0",
    id: Date.now(),
    method,
    params,
  });

  // A utility function for executing a Bitcoin RPC command.

  public executeRpcCommand = async (method: string, params: any[] = []) => {
    try {
      const response = await this.bitcoinRpc.post(
        "/",
        this.createRpcRequest(method, params)
      );
      return response.data.result;
    } catch (error) {
      if (isAxiosError(error)) {
        throw new Error(
          `[${method}]: ${error.response?.data?.error.message ?? error.message}`
        );
      }
    }
  };

  public getBlockchainInfo = (): Promise<BlockchainInfo> =>
    this.executeRpcCommand("getblockchaininfo");

  public getBestBlockHash = (): Promise<string> =>
    this.executeRpcCommand("getbestblockhash");

  public getBlock = <V extends 0 | 1 | 2 = 0>(
    hash: string,
    verbosity: V = 0 as V
  ): Promise<V extends 0 ? string : V extends 1 | 2 ? Block<V> : never> =>
    this.executeRpcCommand("getblock", [hash, verbosity]);

  public getBlockHash = (height: number): Promise<string> =>
    this.executeRpcCommand("getblockhash", [height]);

  public getBlockCount = (): Promise<number> =>
    this.executeRpcCommand("getblockcount");

  public getBlockHeader = (
    hash: string,
    verbose: boolean = true
  ): Promise<BlockHeader | string> =>
    this.executeRpcCommand("getblockheader", [hash, verbose]);

  public getChainTips = (): Promise<ChainTip[]> =>
    this.executeRpcCommand("getchaintips");

  public getDifficulty = (): Promise<number> =>
    this.executeRpcCommand("getdifficulty");

  public getMemPoolInfo = (): Promise<MemPoolInfo> =>
    this.executeRpcCommand("getmempoolinfo");

  public getRawMemPool = <V extends boolean = false>(
    verbose: V = false as V
  ): Promise<V extends false ? [string] : MemPool> =>
    this.executeRpcCommand("getrawmempool", [verbose]);

  public getTxOut = (
    txid: string,
    vout: number,
    include_mempool: boolean = true
  ): Promise<TxOut> =>
    this.executeRpcCommand("gettxout", [txid, vout, include_mempool]);

  public getTxOutProof = (
    txids: string[],
    blockhash: string | null = null
  ): Promise<string> =>
    this.executeRpcCommand("gettxoutproof", [txids, blockhash]);

  public getRawTransaction = <V extends boolean = false>(
    txid: string,
    verbose: V = false as V
  ): Promise<V extends false ? string : RawTransaction> =>
    this.executeRpcCommand("getrawtransaction", [txid, verbose]);

  public sendRawTransaction = (hexstring: string): Promise<string> =>
    this.executeRpcCommand("sendrawtransaction", [hexstring]);
}

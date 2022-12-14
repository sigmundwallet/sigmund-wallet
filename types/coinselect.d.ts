declare module "coinselect" {
  export type CoinSelectTarget = {
    address: string;
    value?: number;
    script?: {
      length: number;
    };
  };

  export type CoinSelectUtxo = {
    vout: number;
    value: number;
    txId: string;
  };

  export type CoinSelectOutput = {
    address?: string;
    value: number;
  };

  export default function coinSelect<T extends CoinSelectUtxo>(
    utxos: T[],
    targets: CoinSelectTarget[],
    feeRate: number,
    changeAddress?: string
  ): {
    inputs: T[];
    outputs: CoinSelectOutput[];
    fee: number;
  };
}

declare module "coinselect/split" {
  type Utxo = {
    vout: number;
    value: number;
    txId: string;
  };

  export default function coinSelectSplit<
    U extends Utxo,
    T extends CoinSelectTarget
  >(
    utxos: U[],
    targets: T[],
    feeRate: number,
    changeAddress?: string
  ): {
    inputs: U[];
    outputs: T[];
    fee: number;
  };
}

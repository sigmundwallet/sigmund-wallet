import b58 from "bs58check";

enum ScriptType {
  P2PKH,
  P2SH_P2WPKH,
  P2WPKH,
  P2SH_P2WSH,
  P2WSH,
}

export const headers = {
  xprv: [0x0488ade4, ScriptType.P2PKH, true, true],
  xpub: [0x0488b21e, ScriptType.P2PKH, false, true],
  yprv: [0x049d7878, ScriptType.P2SH_P2WPKH, true, true],
  ypub: [0x049d7cb2, ScriptType.P2SH_P2WPKH, false, true],
  zprv: [0x04b2430c, ScriptType.P2WPKH, true, true],
  zpub: [0x04b24746, ScriptType.P2WPKH, false, true],
  Yprv: [0x0295b005, ScriptType.P2SH_P2WSH, true, true],
  Ypub: [0x0295b43f, ScriptType.P2SH_P2WSH, false, true],
  Zprv: [0x02aa7a99, ScriptType.P2WSH, true, true],
  Zpub: [0x02aa7ed3, ScriptType.P2WSH, false, true],
  tprv: [0x04358394, ScriptType.P2PKH, true, false],
  tpub: [0x043587cf, ScriptType.P2PKH, false, false],
  uprv: [0x044a4e28, ScriptType.P2SH_P2WPKH, true, false],
  upub: [0x044a5262, ScriptType.P2SH_P2WPKH, false, false],
  vprv: [0x045f18bc, ScriptType.P2WPKH, true, false],
  vpub: [0x045f1cf6, ScriptType.P2WPKH, false, false],
  Uprv: [0x024285b5, ScriptType.P2SH_P2WSH, true, false],
  Upub: [0x024289ef, ScriptType.P2SH_P2WSH, false, false],
  Vprv: [0x02575048, ScriptType.P2WSH, true, false],
  Vpub: [0x02575483, ScriptType.P2WSH, false, false],
} as const;

export function convertXpub<K extends keyof typeof headers>(
  xpub: string,
  to: K extends `${string}pub` ? K : never
) {
  let data = b58.decode(xpub);
  data = data.slice(4);
  const [header] = headers[to];
  return b58.encode(
    Buffer.concat([
      Buffer.from(new Uint32Array([header]).buffer).reverse(),
      data,
    ])
  );
}

export function convertXprv<K extends keyof typeof headers>(
  xpriv: string,
  to: K extends `${string}prv` ? K : never
) {
  let data = b58.decode(xpriv);
  data = data.slice(4);
  const [header] = headers[to];
  return b58.encode(
    Buffer.concat([
      Buffer.from(new Uint32Array([header]).buffer).reverse(),
      data,
    ])
  );
}

export const bigGcd = (a: bigint, b: bigint): bigint => (b === 0n ? a : bigGcd(b, a % b));

export const bigLcm = (a: bigint, b: bigint): bigint => (a / bigGcd(a, b)) * b;

export const textToBig = (s: string): string => {
  const bytes = new TextEncoder().encode(s);
  let acc = 0n;
  for (const b of bytes) acc = (acc << 8n) | BigInt(b);
  return acc.toString();
};

export const bigToText = (num: string): string => {
  try {
    let nBig = BigInt(num);
    const parts: number[] = [];
    while (nBig > 0n) { parts.unshift(Number(nBig & 255n)); nBig >>= 8n; }
    return new TextDecoder().decode(new Uint8Array(parts));
  } catch {
    return '';
  }
};

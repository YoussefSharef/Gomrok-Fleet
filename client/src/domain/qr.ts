// Minimal QR encoder — byte mode, EC level M, versions 1-3, mask 0.
// Ported from the design mockup's qr.js.

const EXP = new Array<number>(512);
const LOG = new Array<number>(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 256) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
}

const mul = (a: number, b: number) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);
const CAP: [number, number, number][] = [
  [0, 0, 0],
  [16, 10, 21],
  [28, 16, 25],
  [44, 26, 29],
]; // [data codewords, ec codewords, size]

function rs(data: number[], n: number): number[] {
  let g = [1];
  for (let i = 0; i < n; i++) {
    const ng = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      ng[j] ^= g[j];
      ng[j + 1] ^= mul(g[j], EXP[i]);
    }
    g = ng;
  }
  const r = data.concat(new Array(n).fill(0));
  for (let i = 0; i < data.length; i++) {
    const c = r[i];
    if (c) for (let j = 0; j < g.length; j++) r[i + j] ^= mul(g[j], c);
  }
  return r.slice(data.length);
}

function encode(text: string): number[][] {
  let bytes = Array.from(new TextEncoder().encode(text));
  let v = 1;
  while (v < 3 && CAP[v][0] < bytes.length + 2) v++;
  const [dc, ec, size] = CAP[v];
  if (bytes.length + 2 > dc) bytes = bytes.slice(0, dc - 2);
  const bits: number[] = [];
  const put = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };
  put(4, 4);
  put(bytes.length, 8);
  bytes.forEach((b) => put(b, 8));
  put(0, Math.min(4, dc * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  for (let p = 0; data.length < dc; p++) data.push(p % 2 ? 0x11 : 0xec);
  const cw = data.concat(rs(data, ec));
  const m: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));
  const fn: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (r: number, c: number, val: number) => {
    m[r][c] = val;
    fn[r][c] = true;
  };
  const finder = (r0: number, c0: number) => {
    for (let r = -1; r <= 7; r++)
      for (let c = -1; c <= 7; c++) {
        const rr = r0 + r,
          cc = c0 + c;
        if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
        const on = r >= 0 && r <= 6 && c >= 0 && c <= 6 && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
        set(rr, cc, on ? 1 : 0);
      }
  };
  finder(0, 0);
  finder(0, size - 7);
  finder(size - 7, 0);
  for (let i = 8; i < size - 8; i++) {
    set(6, i, i % 2 === 0 ? 1 : 0);
    set(i, 6, i % 2 === 0 ? 1 : 0);
  }
  if (v >= 2) {
    const p = size - 7;
    for (let r = -2; r <= 2; r++) for (let c = -2; c <= 2; c++) set(p + r, p + c, Math.max(Math.abs(r), Math.abs(c)) !== 1 ? 1 : 0);
  }
  for (let i = 0; i < 8; i++) {
    fn[8][i] = true;
    fn[i][8] = true;
    fn[8][size - 1 - i] = true;
    fn[size - 1 - i][8] = true;
  }
  fn[8][8] = true;
  set(size - 8, 8, 1);
  const total = cw.length * 8;
  const bit = (i: number) => (i < total ? (cw[i >> 3] >> (7 - (i & 7))) & 1 : 0);
  let bi = 0,
    up = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let k = 0; k < size; k++) {
      const r = up ? size - 1 - k : k;
      for (const c of [col, col - 1]) {
        if (fn[r][c]) continue;
        let b = bit(bi++);
        if ((r + c) % 2 === 0) b ^= 1;
        m[r][c] = b;
      }
    }
    up = !up;
  }
  const f = 0x5412;
  const fb = (b: number) => (f >> b) & 1; // EC M, mask 0
  for (let i = 0; i <= 5; i++) m[i][8] = fb(i);
  m[7][8] = fb(6);
  m[8][8] = fb(7);
  m[8][7] = fb(8);
  for (let i = 9; i <= 14; i++) m[8][14 - i] = fb(i);
  for (let i = 0; i <= 7; i++) m[8][size - 1 - i] = fb(i);
  for (let i = 8; i <= 14; i++) m[size - 15 + i][8] = fb(i);
  return m;
}

export function makeQrSvg(text: string): string {
  const m = encode(text);
  const s = m.length;
  let p = '';
  for (let r = 0; r < s; r++) for (let c = 0; c < s; c++) if (m[r][c]) p += `M${c} ${r}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" shape-rendering="crispEdges"><rect width="${s}" height="${s}" fill="#fff"/><path d="${p}" fill="#111110"/></svg>`;
}

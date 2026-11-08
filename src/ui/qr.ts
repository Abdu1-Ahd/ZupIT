/**
 * Zero-Dependency Pure TypeScript QR Code Generator.
 * Encodes URL strings into standard ISO/IEC 18004 QR Code Model 2 matrices (Byte Mode, ECC Level M).
 * Generates lightweight, pixel-perfect, scalable inline SVG markup.
 */

// Galois Field GF(256) tables with primitive polynomial 0x11d
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

(function initGf() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    EXP[i + 255] = x;
    LOG[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }
})();

function gmul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function rsGeneratorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    const root = EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gmul(poly[j], root);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsCalculate(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = rsGeneratorPoly(ecCount);
  const result = new Uint8Array(ecCount);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ result[0];
    for (let j = 0; j < ecCount - 1; j++) {
      result[j] = result[j + 1] ^ gmul(gen[ecCount - 1 - j], factor);
    }
    result[ecCount - 1] = gmul(gen[0], factor);
  }
  return result;
}

// Version table for ECC Level M
interface QrVersionSpec {
  readonly version: number;
  readonly size: number;
  readonly totalCodewords: number;
  readonly ecCodewords: number;
  readonly maxDataBytes: number;
  readonly alignPos: readonly number[];
}

const QR_SPECS: readonly QrVersionSpec[] = [
  { version: 1, size: 21, totalCodewords: 26, ecCodewords: 10, maxDataBytes: 14, alignPos: [] },
  { version: 2, size: 25, totalCodewords: 44, ecCodewords: 16, maxDataBytes: 26, alignPos: [6, 18] },
  { version: 3, size: 29, totalCodewords: 70, ecCodewords: 26, maxDataBytes: 42, alignPos: [6, 22] },
  { version: 4, size: 33, totalCodewords: 100, ecCodewords: 36, maxDataBytes: 62, alignPos: [6, 26] },
  { version: 5, size: 37, totalCodewords: 134, ecCodewords: 48, maxDataBytes: 84, alignPos: [6, 30] },
];

export class QrMatrix {
  readonly size: number;
  readonly modules: boolean[][];
  readonly reserved: boolean[][];

  constructor(size: number) {
    this.size = size;
    this.modules = Array.from({ length: size }, () => new Array(size).fill(false));
    this.reserved = Array.from({ length: size }, () => new Array(size).fill(false));
  }

  set(r: number, c: number, val: boolean, reserve = true) {
    if (r >= 0 && r < this.size && c >= 0 && c < this.size) {
      this.modules[r][c] = val;
      if (reserve) this.reserved[r][c] = true;
    }
  }

  setupFinder(r: number, c: number) {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size) {
          const isBlack =
            (dr >= 0 && dr <= 6 && (dc === 0 || dc === 6)) ||
            (dc >= 0 && dc <= 6 && (dr === 0 || dr === 6)) ||
            (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
          this.set(nr, nc, isBlack, true);
        }
      }
    }
  }

  setupAlignment(alignPos: readonly number[]) {
    if (alignPos.length < 2) return;
    for (const r of alignPos) {
      for (const c of alignPos) {
        if (this.reserved[r][c]) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isBlack = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
            this.set(r + dr, c + dc, isBlack, true);
          }
        }
      }
    }
  }

  setupTiming() {
    for (let i = 8; i < this.size - 8; i++) {
      const v = i % 2 === 0;
      if (!this.reserved[6][i]) this.set(6, i, v, true);
      if (!this.reserved[i][6]) this.set(i, 6, v, true);
    }
  }

  setupFormat(version: number) {
    // Format bits for ECC Level M, Mask pattern 0 (0b101010000010010 = 0x5412)
    const formatBits = 0x5412;
    // Dark module at (4*version + 9, 8)
    this.set(4 * version + 9, 8, true, true);

    // Write format bits
    for (let i = 0; i < 15; i++) {
      const bit = ((formatBits >> i) & 1) === 1;
      if (i < 6) {
        this.set(8, i, bit, true);
      } else if (i < 8) {
        this.set(8, i + 1, bit, true);
      } else {
        this.set(14 - i, 8, bit, true);
      }

      if (i < 8) {
        this.set(this.size - 1 - i, 8, bit, true);
      } else {
        this.set(8, this.size - 15 + i, bit, true);
      }
    }
  }
}

/**
 * Encodes text into QR matrix modules (Byte Mode, ECC Level M).
 */
export function encodeQrMatrix(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text);
  let spec = QR_SPECS.find((s) => s.maxDataBytes >= bytes.length);
  if (!spec) {
    spec = QR_SPECS[QR_SPECS.length - 1]; // Fallback to max supported version
  }

  const { version, size, totalCodewords, ecCodewords, maxDataBytes, alignPos } = spec;
  const qr = new QrMatrix(size);

  // Setup functional patterns
  qr.setupFinder(0, 0);
  qr.setupFinder(0, size - 7);
  qr.setupFinder(size - 7, 0);
  qr.setupTiming();
  qr.setupAlignment(alignPos);
  qr.setupFormat(version);

  // Build bitstream: Mode (0100) + Char Count (8 bits) + Bytes
  const bitstream: number[] = [];
  function pushBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      bitstream.push((val >> i) & 1);
    }
  }

  pushBits(0b0100, 4); // Byte mode
  pushBits(Math.min(bytes.length, maxDataBytes), 8); // Count
  for (let i = 0; i < Math.min(bytes.length, maxDataBytes); i++) {
    pushBits(bytes[i], 8);
  }

  // Terminator (up to 4 bits)
  const maxDataBits = maxDataBytes * 8;
  const termLen = Math.min(4, maxDataBits - bitstream.length);
  pushBits(0, termLen);

  // Pad to multiple of 8
  while (bitstream.length % 8 !== 0) {
    bitstream.push(0);
  }

  // Pad bytes alternating 0xEC and 0x11
  const dataCodewords = new Uint8Array(maxDataBytes);
  let byteIdx = 0;
  for (let i = 0; i < bitstream.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bitstream[i + j];
    }
    dataCodewords[byteIdx++] = b;
  }

  const padBytes = [0xec, 0x11];
  let padToggle = 0;
  while (byteIdx < maxDataBytes) {
    dataCodewords[byteIdx++] = padBytes[padToggle];
    padToggle ^= 1;
  }

  // Calculate ECC codewords
  const ecData = rsCalculate(dataCodewords, ecCodewords);

  // Assemble final codeword stream (Data + ECC)
  const allCodewords = new Uint8Array(totalCodewords);
  allCodewords.set(dataCodewords, 0);
  allCodewords.set(ecData, maxDataBytes);

  // Place codewords in zig-zag order
  const allBits: number[] = [];
  for (let i = 0; i < allCodewords.length; i++) {
    for (let b = 7; b >= 0; b--) {
      allBits.push((allCodewords[i] >> b) & 1);
    }
  }

  let bitIndex = 0;
  let dir = -1; // Moving upwards first
  let c = size - 1;
  let r = size - 1;

  while (c > 0) {
    if (c === 6) c--; // Skip vertical timing line

    for (let step = 0; step < size; step++) {
      const curRow = r + step * dir;
      for (let colOffset = 0; colOffset < 2; colOffset++) {
        const curCol = c - colOffset;
        if (!qr.reserved[curRow][curCol]) {
          const bit = bitIndex < allBits.length ? allBits[bitIndex++] : 0;
          // Apply Mask 0: (row + col) % 2 === 0
          const mask = (curRow + curCol) % 2 === 0;
          qr.set(curRow, curCol, (bit === 1) !== mask, false);
        }
      }
    }

    r += (size - 1) * dir;
    dir = -dir;
    c -= 2;
  }

  return qr.modules;
}

/**
 * Generates a clean, scalable SVG string representing the QR Code.
 */
export function generateQrSvg(text: string, size = 180): string {
  const modules = encodeQrMatrix(text);
  const matrixSize = modules.length;
  const margin = 2;
  const viewBoxSize = matrixSize + margin * 2;

  let pathData = "";
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (modules[r][c]) {
        pathData += `M${c + margin},${r + margin}h1v1h-1z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" shape-rendering="crispEdges">
  <rect width="100%" height="100%" fill="#ffffff" rx="10"/>
  <path d="${pathData.trim()}" fill="#0d0d0c"/>
</svg>`;
}

/**
 * Emits the client-side QR generation script embedded directly into the browser DOM.
 */
export function renderQrScript(): string {
  return `
    // Pure Zero-Dependency In-Browser QR Matrix Generator
    const QR_EXP = new Uint8Array(512);
    const QR_LOG = new Uint8Array(256);
    (function() {
      let x = 1;
      for (let i = 0; i < 255; i++) {
        QR_EXP[i] = x;
        QR_EXP[i + 255] = x;
        QR_LOG[x] = i;
        x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
      }
    })();

    function qrGmul(a, b) {
      if (a === 0 || b === 0) return 0;
      return QR_EXP[QR_LOG[a] + QR_LOG[b]];
    }

    function qrRsGen(deg) {
      let poly = [1];
      for (let i = 0; i < deg; i++) {
        const next = new Array(poly.length + 1).fill(0);
        const root = QR_EXP[i];
        for (let j = 0; j < poly.length; j++) {
          next[j] ^= qrGmul(poly[j], root);
          next[j + 1] ^= poly[j];
        }
        poly = next;
      }
      return poly;
    }

    function qrRsCalc(data, ecCount) {
      const gen = qrRsGen(ecCount);
      const res = new Uint8Array(ecCount);
      for (let i = 0; i < data.length; i++) {
        const factor = data[i] ^ res[0];
        for (let j = 0; j < ecCount - 1; j++) {
          res[j] = res[j + 1] ^ qrGmul(gen[ecCount - 1 - j], factor);
        }
        res[ecCount - 1] = qrGmul(gen[0], factor);
      }
      return res;
    }

    const QR_CLIENT_SPECS = [
      { v: 1, sz: 21, tc: 26, ec: 10, mb: 14, al: [] },
      { v: 2, sz: 25, tc: 44, ec: 16, mb: 26, al: [6, 18] },
      { v: 3, sz: 29, tc: 70, ec: 26, mb: 42, al: [6, 22] },
      { v: 4, sz: 33, tc: 100, ec: 36, mb: 62, al: [6, 26] },
      { v: 5, sz: 37, tc: 134, ec: 48, mb: 84, al: [6, 30] }
    ];

    function renderClientQrSvg(text, size = 180) {
      const bytes = new TextEncoder().encode(text);
      let spec = QR_CLIENT_SPECS.find(s => s.mb >= bytes.length) || QR_CLIENT_SPECS[QR_CLIENT_SPECS.length - 1];
      const { v, sz, tc, ec, mb, al } = spec;

      const modules = Array.from({ length: sz }, () => new Array(sz).fill(false));
      const reserved = Array.from({ length: sz }, () => new Array(sz).fill(false));

      function setMod(r, c, val, res = true) {
        if (r >= 0 && r < sz && c >= 0 && c < sz) {
          modules[r][c] = val;
          if (res) reserved[r][c] = true;
        }
      }

      function setupFinder(r, c) {
        for (let dr = -1; dr <= 7; dr++) {
          for (let dc = -1; dc <= 7; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < sz && nc >= 0 && nc < sz) {
              const isBlack = (dr >= 0 && dr <= 6 && (dc === 0 || dc === 6)) ||
                              (dc >= 0 && dc <= 6 && (dr === 0 || dr === 6)) ||
                              (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
              setMod(nr, nc, isBlack, true);
            }
          }
        }
      }

      setupFinder(0, 0);
      setupFinder(0, sz - 7);
      setupFinder(sz - 7, 0);

      for (let i = 8; i < sz - 8; i++) {
        const isBlack = i % 2 === 0;
        if (!reserved[6][i]) setMod(6, i, isBlack, true);
        if (!reserved[i][6]) setMod(i, 6, isBlack, true);
      }

      if (al.length >= 2) {
        for (const ar of al) {
          for (const ac of al) {
            if (reserved[ar][ac]) continue;
            for (let dr = -2; dr <= 2; dr++) {
              for (let dc = -2; dc <= 2; dc++) {
                setMod(ar + dr, ac + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1, true);
              }
            }
          }
        }
      }

      const formatBits = 0x5412;
      setMod(4 * v + 9, 8, true, true);
      for (let i = 0; i < 15; i++) {
        const bit = ((formatBits >> i) & 1) === 1;
        if (i < 6) setMod(8, i, bit, true);
        else if (i < 8) setMod(8, i + 1, bit, true);
        else setMod(14 - i, 8, bit, true);

        if (i < 8) setMod(sz - 1 - i, 8, bit, true);
        else setMod(8, sz - 15 + i, bit, true);
      }

      const bits = [];
      function push(val, len) {
        for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
      }
      push(0b0100, 4);
      push(Math.min(bytes.length, mb), 8);
      for (let i = 0; i < Math.min(bytes.length, mb); i++) push(bytes[i], 8);

      const maxBits = mb * 8;
      const termLen = Math.min(4, maxBits - bits.length);
      push(0, termLen);
      while (bits.length % 8 !== 0) bits.push(0);

      const dataWords = new Uint8Array(mb);
      let byteIdx = 0;
      for (let i = 0; i < bits.length; i += 8) {
        let b = 0;
        for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
        dataWords[byteIdx++] = b;
      }
      const padBytes = [0xec, 0x11];
      let padToggle = 0;
      while (byteIdx < mb) {
        dataWords[byteIdx++] = padBytes[padToggle];
        padToggle ^= 1;
      }

      const ecWords = qrRsCalc(dataWords, ec);
      const allWords = new Uint8Array(tc);
      allWords.set(dataWords, 0);
      allWords.set(ecWords, mb);

      const allBits = [];
      for (let i = 0; i < allWords.length; i++) {
        for (let b = 7; b >= 0; b--) allBits.push((allWords[i] >> b) & 1);
      }

      let bitIdx = 0;
      let dir = -1;
      let c = sz - 1;
      let r = sz - 1;

      while (c > 0) {
        if (c === 6) c--;
        for (let step = 0; step < sz; step++) {
          const curRow = r + step * dir;
          for (let colOffset = 0; colOffset < 2; colOffset++) {
            const curCol = c - colOffset;
            if (!reserved[curRow][curCol]) {
              const bit = bitIdx < allBits.length ? allBits[bitIdx++] : 0;
              const mask = (curRow + curCol) % 2 === 0;
              setMod(curRow, curCol, (bit === 1) !== mask, false);
            }
          }
        }
        r += (sz - 1) * dir;
        dir = -dir;
        c -= 2;
      }

      const margin = 2;
      const vb = sz + margin * 2;
      let path = '';
      for (let row = 0; row < sz; row++) {
        for (let col = 0; col < sz; col++) {
          if (modules[row][col]) {
            path += 'M' + (col + margin) + ',' + (row + margin) + 'h1v1h-1z ';
          }
        }
      }

      return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + vb + ' ' + vb + '" shape-rendering="crispEdges">' +
        '<rect width="100%" height="100%" fill="#ffffff" rx="10"/>' +
        '<path d="' + path.trim() + '" fill="#0d0d0c"/>' +
      '</svg>';
    }
  `;
}


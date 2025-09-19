# ZPR Compression Format

## Overview

ZPR is a custom compression format used in Phantasy Star Zero to compress NARC archives and other game assets. The format combines XOR encryption with PRS (Phantasy Star compression) algorithm.

## File Structure

### ZPR Header

| Offset | Size | Type   | Description                    |
|--------|------|--------|--------------------------------|
| 0x00   | 4    | char[] | Magic signature "ZPR\0"       |
| 0x04   | 4    | uint32 | Unknown/Version (little-endian)|
| 0x08   | 4    | uint32 | Decompressed size (little-endian) |
| 0x0C   | 4    | uint32 | Unknown/Checksum               |
| 0x10   | ...  | byte[] | Compressed data                |

```typescript
interface ZPRHeader {
  magic: string;        // "ZPR\0"
  version: number;      // Unknown purpose
  decompressedSize: number;
  checksum: number;     // Unknown purpose
}
```

### Compressed Data Format

The compressed data starting at offset 0x10 is:
1. **XOR Encrypted** with key `0x95`
2. **PRS Compressed** using a variant of the Phantasy Star compression algorithm

## Decompression Process

### Step 1: Header Validation
```typescript
function validateZPRHeader(buffer: ArrayBuffer): ZPRHeader | null {
  const view = new DataView(buffer);
  const magic = new TextDecoder().decode(buffer.slice(0, 4));

  if (magic !== "ZPR\0") {
    return null;
  }

  return {
    magic,
    version: view.getUint32(0x04, true),
    decompressedSize: view.getUint32(0x08, true),
    checksum: view.getUint32(0x0C, true)
  };
}
```

### Step 2: XOR Decryption
```typescript
function xorDecrypt(data: Uint8Array): Uint8Array {
  const decrypted = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    decrypted[i] = data[i] ^ 0x95;
  }
  return decrypted;
}
```

### Step 3: PRS Decompression

The PRS algorithm uses control bits to determine whether to:
- Copy literal bytes
- Copy from a back-reference (LZ77-style)

#### Control Bit Structure
- **1-bit**: Copy literal byte
- **0-bit**: Back-reference copy

#### Back-reference Encoding
Two types of back-references:

**Type 1 (Long Distance)**:
- Control bit sequence: `01`
- 2-byte offset encoding: `(byte2 << 5) + (byte1 >> 3) - 8192`
- Length: `(byte1 & 7) + 2` or extended length if zero

**Type 2 (Short Distance)**:
- Control bit sequence: `00`
- 1-byte offset: `byte - 256`
- Length encoded in control bits: base 2 + additional bits

### Complete Decompression Function

```typescript
class PRSDecompressor {
  private ctrlByte: number = 0;
  private ctrlByteCounter: number = 1;
  private buffer: Uint8Array;
  private position: number = 0;

  private getControlBit(): boolean {
    this.ctrlByteCounter--;
    if (this.ctrlByteCounter === 0) {
      this.ctrlByte = this.buffer[this.position++];
      this.ctrlByteCounter = 8;
    }
    const bit = (this.ctrlByte & 1) > 0;
    this.ctrlByte >>= 1;
    return bit;
  }

  decompress(input: Uint8Array, outputSize: number): Uint8Array {
    this.buffer = input;
    this.position = 0;
    this.ctrlByte = 0;
    this.ctrlByteCounter = 1;

    const output = new Uint8Array(outputSize);
    let outputPos = 0;

    while (outputPos < outputSize && this.position < input.length) {
      // Copy literal bytes
      while (this.getControlBit()) {
        output[outputPos++] = this.buffer[this.position++];
      }

      let offset: number, length: number;

      if (this.getControlBit()) {
        // Long distance back-reference
        const byte1 = this.buffer[this.position++];
        const byte2 = this.buffer[this.position++];

        if (byte1 === 0 && byte2 === 0) break;

        offset = (byte2 << 5) + (byte1 >> 3) - 8192;
        const lengthPart = byte1 & 7;
        length = lengthPart !== 0 ? lengthPart + 2 : this.buffer[this.position++] + 10;
      } else {
        // Short distance back-reference
        length = 2;
        if (this.getControlBit()) length += 2;
        if (this.getControlBit()) length++;
        offset = this.buffer[this.position++] - 256;
      }

      // Copy from back-reference
      const copyPos = offset + outputPos;
      for (let i = 0; i < length && outputPos < output.length; i++) {
        output[outputPos++] = output[copyPos + i];
      }
    }

    return output;
  }
}

export function decompressZPR(buffer: ArrayBuffer): Uint8Array | null {
  const header = validateZPRHeader(buffer);
  if (!header) return null;

  // Extract compressed data (skip 16-byte header)
  const compressedData = new Uint8Array(buffer.slice(0x10));

  // XOR decrypt
  const decrypted = xorDecrypt(compressedData);

  // PRS decompress
  const decompressor = new PRSDecompressor();
  return decompressor.decompress(decrypted, header.decompressedSize);
}
```

## Usage Examples

### Basic File Decompression
```typescript
import { readFileSync, writeFileSync } from 'fs';
import { decompressZPR } from './zpr-decompressor';

function decompressFile(inputPath: string, outputPath: string): boolean {
  try {
    const buffer = readFileSync(inputPath).buffer;
    const decompressed = decompressZPR(buffer);

    if (!decompressed) {
      console.error('Not a valid ZPR file');
      return false;
    }

    writeFileSync(outputPath, decompressed);
    return true;
  } catch (error) {
    console.error('Decompression failed:', error);
    return false;
  }
}
```

### Batch Processing
```typescript
async function batchDecompress(inputDir: string, outputDir: string) {
  const files = await readdir(inputDir);

  for (const file of files) {
    if (file.endsWith('.narc')) {
      const inputPath = join(inputDir, file);
      const outputPath = join(outputDir, file.replace('.narc', '_decompressed.narc'));

      console.log(`Processing ${file}...`);
      const success = decompressFile(inputPath, outputPath);
      console.log(success ? 'Success' : 'Failed');
    }
  }
}
```

## Notes

- The XOR key `0x95` is consistent across all observed ZPR files
- PRS compression is a variant used in multiple Sega games
- The format is specifically tailored for Nintendo DS architecture limitations
- Some ZPR files may contain additional encryption layers (not documented here)
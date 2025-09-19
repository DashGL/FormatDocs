/**
 * ZPR Decompression Utility for Phantasy Star Zero
 *
 * This script handles decompression of ZPR-compressed NARC archives
 * and other game assets from Phantasy Star Zero (Nintendo DS).
 */

import { readFileSync, writeFileSync } from 'fs';

export interface ZPRHeader {
  magic: string;
  version: number;
  decompressedSize: number;
  checksum: number;
}

/**
 * PRS Decompressor class implementing the Phantasy Star compression algorithm
 */
export class PRSDecompressor {
  private ctrlByte: number = 0;
  private ctrlByteCounter: number = 1;
  private buffer: Uint8Array = new Uint8Array(0);
  private position: number = 0;
  private numCtrlBytes: number = 1;

  /**
   * Get the next control bit from the compressed stream
   */
  private getControlBit(): boolean {
    this.ctrlByteCounter--;
    if (this.ctrlByteCounter === 0) {
      this.ctrlByte = this.buffer[this.position++];
      this.ctrlByteCounter = 8;
      this.numCtrlBytes++;
    }
    const bit = (this.ctrlByte & 1) > 0;
    this.ctrlByte >>= 1;
    return bit;
  }

  /**
   * Decompress PRS-compressed data
   * @param input Compressed data buffer
   * @param outputSize Expected decompressed size
   * @returns Decompressed data
   */
  public decompress(input: Uint8Array, outputSize: number): Uint8Array {
    this.buffer = input;
    this.position = 0;
    this.ctrlByte = 0;
    this.ctrlByteCounter = 1;
    this.numCtrlBytes = 1;

    const output = new Uint8Array(outputSize);
    let outputPos = 0;

    while (outputPos < outputSize && this.position < input.length) {
      // Copy literal bytes
      while (this.getControlBit()) {
        if (this.position >= this.buffer.length) break;
        output[outputPos++] = this.buffer[this.position++];
      }

      if (outputPos >= outputSize) break;

      let offset: number, length: number;

      if (this.getControlBit()) {
        // Long distance back-reference (2-byte encoding)
        if (this.position >= this.buffer.length - 1) break;

        const byte1 = this.buffer[this.position++];
        const byte2 = this.buffer[this.position++];

        if (byte1 === 0 && byte2 === 0) {
          // End marker
          break;
        }

        offset = (byte2 << 5) + (byte1 >> 3) - 8192;
        const lengthPart = byte1 & 7;

        if (lengthPart !== 0) {
          length = lengthPart + 2;
        } else {
          if (this.position >= this.buffer.length) break;
          length = this.buffer[this.position++] + 10;
        }
      } else {
        // Short distance back-reference
        length = 2;
        if (this.getControlBit()) length += 2;
        if (this.getControlBit()) length++;

        if (this.position >= this.buffer.length) break;
        offset = this.buffer[this.position++] - 256;
      }

      // Copy from back-reference
      const copyPos = offset + outputPos;
      for (let i = 0; i < length && outputPos < output.length; i++) {
        if (copyPos + i >= 0 && copyPos + i < outputPos) {
          output[outputPos++] = output[copyPos + i];
        } else {
          // Handle invalid back-reference
          outputPos++;
        }
      }
    }

    return output;
  }
}

/**
 * Validate and parse ZPR file header
 * @param buffer File buffer
 * @returns Parsed header or null if invalid
 */
export function validateZPRHeader(buffer: ArrayBuffer): ZPRHeader | null {
  if (buffer.byteLength < 16) return null;

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

/**
 * XOR decrypt data with the PSZ key (0x95)
 * @param data Encrypted data
 * @returns Decrypted data
 */
export function xorDecrypt(data: Uint8Array): Uint8Array {
  const decrypted = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    decrypted[i] = data[i] ^ 0x95;
  }
  return decrypted;
}

/**
 * Decompress a ZPR file
 * @param buffer ZPR file buffer
 * @returns Decompressed data or null if invalid
 */
export function decompressZPR(buffer: ArrayBuffer): Uint8Array | null {
  const header = validateZPRHeader(buffer);
  if (!header) {
    return null;
  }

  // Extract compressed data (skip 16-byte header)
  const compressedData = new Uint8Array(buffer.slice(0x10));

  // XOR decrypt
  const decrypted = xorDecrypt(compressedData);

  // PRS decompress
  const decompressor = new PRSDecompressor();
  return decompressor.decompress(decrypted, header.decompressedSize);
}

/**
 * Decompress a ZPR file from disk
 * @param inputPath Input file path
 * @param outputPath Output file path
 * @returns Success status
 */
export function decompressZPRFile(inputPath: string, outputPath: string): boolean {
  try {
    console.log(`Reading file: ${inputPath}`);
    const buffer = readFileSync(inputPath).buffer;

    const decompressed = decompressZPR(buffer);
    if (!decompressed) {
      console.error('Not a valid ZPR file or decompression failed');
      return false;
    }

    writeFileSync(outputPath, decompressed);
    console.log(`Successfully decompressed to: ${outputPath}`);
    console.log(`Decompressed size: ${decompressed.length} bytes`);

    return true;
  } catch (error) {
    console.error('Decompression error:', error);
    return false;
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    console.log('Usage: npx ts-node zpr-decompress.ts <input.narc> <output.narc>');
    console.log('');
    console.log('Example:');
    console.log('  npx ts-node zpr-decompress.ts player.narc player_decompressed.narc');
    process.exit(1);
  }

  const [inputPath, outputPath] = args;
  const success = decompressZPRFile(inputPath, outputPath);
  process.exit(success ? 0 : 1);
}
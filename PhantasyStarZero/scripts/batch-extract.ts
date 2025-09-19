/**
 * Batch Asset Extraction Utility for Phantasy Star Zero
 *
 * This script processes entire directories of ZPR-compressed files,
 * decompresses them, and extracts individual assets with proper naming.
 */

import { readdir, mkdir, readFileSync, writeFileSync, stat } from 'fs/promises';
import { join, basename, extname, dirname } from 'path';
import { decompressZPR, ZPRHeader } from './zpr-decompress';

export interface ExtractionResult {
  inputFile: string;
  success: boolean;
  error?: string;
  extractedFiles: ExtractedAsset[];
}

export interface ExtractedAsset {
  filename: string;
  type: AssetType;
  size: number;
  index: number;
}

export type AssetType = 'nsbmd' | 'nsbtx' | 'nsbca' | 'nsbtp' | 'nsbta' | 'narc' | 'unknown';

/**
 * NARC file structure parser
 */
export class NARCExtractor {
  private buffer: ArrayBuffer;
  private view: DataView;

  constructor(buffer: ArrayBuffer) {
    this.buffer = buffer;
    this.view = new DataView(buffer);
  }

  /**
   * Detect file type from magic signature
   */
  private detectAssetType(data: Uint8Array): AssetType {
    if (data.length < 4) return 'unknown';

    const magic = new TextDecoder().decode(data.slice(0, 4));

    switch (magic) {
      case 'BMD0': return 'nsbmd';
      case 'BTX0': return 'nsbtx';
      case 'BCA0': return 'nsbca';
      case 'BTP0': return 'nsbtp';
      case 'BTA0': return 'nsbta';
      case 'NARC': return 'narc';
      default: return 'unknown';
    }
  }

  /**
   * Validate NARC header
   */
  private validateHeader(): boolean {
    const magic = new TextDecoder().decode(this.buffer.slice(0, 4));
    return magic === 'NARC';
  }

  /**
   * Extract all files from NARC archive
   */
  public extractFiles(): ExtractedAsset[] {
    if (!this.validateHeader()) {
      throw new Error('Invalid NARC file');
    }

    // Read FATB section
    const fatbMagic = new TextDecoder().decode(this.buffer.slice(0x10, 0x14));
    if (fatbMagic !== 'BTAF') {
      throw new Error('Invalid FATB section');
    }

    const fatbSize = this.view.getUint32(0x14, true);
    const fileCount = this.view.getUint32(0x18, true);

    // Read file allocation entries
    const entries: Array<{start: number, end: number}> = [];
    let offset = 0x1C;

    for (let i = 0; i < fileCount; i++) {
      entries.push({
        start: this.view.getUint32(offset, true),
        end: this.view.getUint32(offset + 4, true)
      });
      offset += 8;
    }

    // Find FIMG section (skip FNTB)
    let fimgOffset = 0x10 + fatbSize;
    const fntbSize = this.view.getUint32(fimgOffset + 4, true);
    fimgOffset += fntbSize;

    // Verify FIMG magic
    const fimgMagic = new TextDecoder().decode(this.buffer.slice(fimgOffset, fimgOffset + 4));
    if (fimgMagic !== 'GMIF') {
      throw new Error('Invalid FIMG section');
    }

    const fimgDataStart = fimgOffset + 8;

    // Extract files
    const extractedFiles: ExtractedAsset[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const fileStart = fimgDataStart + entry.start;
      const fileEnd = fimgDataStart + entry.end;
      const fileData = new Uint8Array(this.buffer.slice(fileStart, fileEnd));

      const assetType = this.detectAssetType(fileData);
      const extension = assetType === 'unknown' ? 'bin' : assetType;
      const filename = `${i.toString().padStart(2, '0')}.${extension}`;

      extractedFiles.push({
        filename,
        type: assetType,
        size: fileData.length,
        index: i
      });
    }

    return extractedFiles;
  }

  /**
   * Extract file data by index
   */
  public extractFileData(index: number): Uint8Array {
    // Read FATB section
    const fatbSize = this.view.getUint32(0x14, true);
    const fileCount = this.view.getUint32(0x18, true);

    if (index >= fileCount) {
      throw new Error(`File index ${index} out of range (max: ${fileCount - 1})`);
    }

    // Get file entry
    const entryOffset = 0x1C + (index * 8);
    const start = this.view.getUint32(entryOffset, true);
    const end = this.view.getUint32(entryOffset + 4, true);

    // Find FIMG section
    let fimgOffset = 0x10 + fatbSize;
    const fntbSize = this.view.getUint32(fimgOffset + 4, true);
    fimgOffset += fntbSize;

    const fimgDataStart = fimgOffset + 8;
    const fileStart = fimgDataStart + start;
    const fileEnd = fimgDataStart + end;

    return new Uint8Array(this.buffer.slice(fileStart, fileEnd));
  }
}

/**
 * Process a single ZPR file
 */
export async function processZPRFile(inputPath: string, outputDir: string): Promise<ExtractionResult> {
  const result: ExtractionResult = {
    inputFile: inputPath,
    success: false,
    extractedFiles: []
  };

  try {
    // Read and decompress ZPR file
    const compressedBuffer = readFileSync(inputPath).buffer;
    const decompressed = decompressZPR(compressedBuffer);

    if (!decompressed) {
      result.error = 'Not a valid ZPR file';
      return result;
    }

    // Extract NARC contents
    const narcExtractor = new NARCExtractor(decompressed.buffer);
    const extractedAssets = narcExtractor.extractFiles();

    // Create output directory
    const baseName = basename(inputPath, extname(inputPath));
    const assetOutputDir = join(outputDir, baseName);
    await mkdir(assetOutputDir, { recursive: true });

    // Extract individual files
    for (const asset of extractedAssets) {
      const fileData = narcExtractor.extractFileData(asset.index);
      const outputPath = join(assetOutputDir, asset.filename);

      await writeFileSync(outputPath, fileData);
      result.extractedFiles.push(asset);
    }

    result.success = true;
    return result;

  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    return result;
  }
}

/**
 * Batch process a directory of ZPR files
 */
export async function batchExtractDirectory(
  inputDir: string,
  outputDir: string,
  options: {
    recursive?: boolean;
    filePattern?: RegExp;
    verbose?: boolean;
  } = {}
): Promise<ExtractionResult[]> {
  const { recursive = false, filePattern = /\.narc$/, verbose = true } = options;
  const results: ExtractionResult[] = [];

  try {
    // Ensure output directory exists
    await mkdir(outputDir, { recursive: true });

    // Read directory contents
    const entries = await readdir(inputDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(inputDir, entry.name);

      if (entry.isDirectory() && recursive) {
        // Recursively process subdirectories
        const subResults = await batchExtractDirectory(
          fullPath,
          join(outputDir, entry.name),
          options
        );
        results.push(...subResults);
      } else if (entry.isFile() && filePattern.test(entry.name)) {
        if (verbose) {
          console.log(`Processing: ${entry.name}`);
        }

        const result = await processZPRFile(fullPath, outputDir);
        results.push(result);

        if (verbose) {
          if (result.success) {
            console.log(`  ✅ Extracted ${result.extractedFiles.length} files`);
            for (const asset of result.extractedFiles) {
              console.log(`    - ${asset.filename} (${asset.type}, ${asset.size} bytes)`);
            }
          } else {
            console.log(`  ❌ Failed: ${result.error}`);
          }
        }
      }
    }

  } catch (error) {
    console.error('Batch extraction error:', error);
  }

  return results;
}

/**
 * Generate extraction summary report
 */
export function generateExtractionReport(results: ExtractionResult[]): string {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  const assetTypeCounts: Record<AssetType, number> = {
    nsbmd: 0,
    nsbtx: 0,
    nsbca: 0,
    nsbtp: 0,
    nsbta: 0,
    narc: 0,
    unknown: 0
  };

  let totalAssets = 0;
  for (const result of successful) {
    for (const asset of result.extractedFiles) {
      assetTypeCounts[asset.type]++;
      totalAssets++;
    }
  }

  const report = [
    '# Phantasy Star Zero Extraction Report',
    '',
    `## Summary`,
    `- Total files processed: ${results.length}`,
    `- Successful extractions: ${successful.length}`,
    `- Failed extractions: ${failed.length}`,
    `- Total assets extracted: ${totalAssets}`,
    '',
    '## Asset Type Distribution',
  ];

  for (const [type, count] of Object.entries(assetTypeCounts)) {
    if (count > 0) {
      report.push(`- ${type.toUpperCase()}: ${count} files`);
    }
  }

  if (failed.length > 0) {
    report.push('', '## Failed Extractions');
    for (const result of failed) {
      report.push(`- ${basename(result.inputFile)}: ${result.error}`);
    }
  }

  return report.join('\n');
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: npx ts-node batch-extract.ts <input-dir> <output-dir> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --recursive     Process subdirectories recursively');
    console.log('  --pattern REGEX File pattern to match (default: \\.narc$)');
    console.log('  --quiet         Suppress verbose output');
    console.log('');
    console.log('Examples:');
    console.log('  npx ts-node batch-extract.ts ./data/player ./extracted/player');
    console.log('  npx ts-node batch-extract.ts ./data ./extracted --recursive');
    process.exit(1);
  }

  const [inputDir, outputDir] = args;
  const recursive = args.includes('--recursive');
  const quiet = args.includes('--quiet');

  const patternIndex = args.indexOf('--pattern');
  const pattern = patternIndex >= 0 && patternIndex + 1 < args.length
    ? new RegExp(args[patternIndex + 1])
    : /\.narc$/;

  console.log(`Batch extracting from ${inputDir} to ${outputDir}`);
  console.log(`Options: recursive=${recursive}, pattern=${pattern}, verbose=${!quiet}`);
  console.log('');

  batchExtractDirectory(inputDir, outputDir, {
    recursive,
    filePattern: pattern,
    verbose: !quiet
  }).then(results => {
    console.log('');
    console.log('Extraction complete!');
    console.log(generateExtractionReport(results));
  }).catch(error => {
    console.error('Batch extraction failed:', error);
    process.exit(1);
  });
}
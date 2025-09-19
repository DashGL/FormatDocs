# NARC Archive Format

## Overview

NARC (Nitro ARChive) is Nintendo's standard archive format for DS games. In Phantasy Star Zero, NARC files are compressed using the ZPR format and must be decompressed before processing.

## Standard NARC Structure

After ZPR decompression, NARC files follow the standard Nintendo DS format:

### NARC Header

| Offset | Size | Type   | Description                    |
|--------|------|--------|--------------------------------|
| 0x00   | 4    | char[] | Magic signature "NARC"        |
| 0x04   | 2    | uint16 | Byte order mark (0xFFFE)      |
| 0x06   | 2    | uint16 | Version (0x0100)              |
| 0x08   | 4    | uint32 | File size                     |
| 0x0C   | 2    | uint16 | Header size (0x10)            |
| 0x0E   | 2    | uint16 | Number of sections (0x03)     |

```typescript
interface NARCHeader {
  magic: string;        // "NARC"
  byteOrder: number;    // 0xFFFE
  version: number;      // 0x0100
  fileSize: number;     // Total archive size
  headerSize: number;   // 0x10
  sectionCount: number; // 0x03
}
```

### File Allocation Table Block (FATB)

| Offset | Size | Type   | Description                    |
|--------|------|--------|--------------------------------|
| 0x10   | 4    | char[] | Section magic "BTAF"          |
| 0x14   | 4    | uint32 | Section size                   |
| 0x18   | 4    | uint32 | Number of files                |
| 0x1C   | ...  | Entry[]| File allocation entries       |

#### File Allocation Entry

| Offset | Size | Type   | Description                    |
|--------|------|--------|--------------------------------|
| 0x00   | 4    | uint32 | File start offset              |
| 0x04   | 4    | uint32 | File end offset                |

```typescript
interface FATEntry {
  startOffset: number;
  endOffset: number;
}

interface FATBSection {
  magic: string;        // "BTAF"
  sectionSize: number;
  fileCount: number;
  entries: FATEntry[];
}
```

### File Name Table Block (FNTB)

| Offset | Size | Type   | Description                    |
|--------|------|--------|--------------------------------|
| 0x00   | 4    | char[] | Section magic "BTNF"          |
| 0x04   | 4    | uint32 | Section size                   |
| 0x08   | ...  | ...    | Directory structure            |

Most PSZ NARC files use simple numeric naming (00, 01, 02, etc.)

### File Image Block (FIMG)

| Offset | Size | Type   | Description                    |
|--------|------|--------|--------------------------------|
| 0x00   | 4    | char[] | Section magic "GMIF"          |
| 0x04   | 4    | uint32 | Section size                   |
| 0x08   | ...  | byte[] | Concatenated file data         |

## PSZ-Specific NARC Content Patterns

### Player Weapon Archives

Player weapon NARC files typically contain:

| File Index | Content Type | Description              |
|------------|--------------|--------------------------|
| 00         | NSBMD        | 3D weapon model (BMD0)  |
| 01         | NSBCA        | Weapon animations (BCA0) |
| 02         | NSBTX        | Weapon textures (BTX0)   |

```typescript
interface WeaponNARC {
  model: NSBMDFile;      // 3D model data
  animation: NSBCAFile;  // Animation data
  texture: NSBTXFile;    // Texture data
}
```

### Enemy Archives

Enemy NARC files typically contain:

| File Index | Content Type | Description              |
|------------|--------------|--------------------------|
| 00         | NSBMD        | Enemy model              |
| 01         | NSBCA        | Movement animations      |
| 02         | NSBCA        | Attack animations        |
| 03         | NSBTX        | Enemy textures           |
| 04+        | Various      | AI data, effects, etc.   |

### Environment Object Archives

Object NARC files follow the pattern:

| File Index | Content Type | Description              |
|------------|--------------|--------------------------|
| 00         | NSBMD        | Object model             |
| 01         | NSBTX        | Object textures          |
| 02         | NSBTP        | Pattern animations (opt) |
| 03         | NSBTA        | Material animations (opt)|

## NARC Processing Functions

### Basic NARC Reader

```typescript
class NARCReader {
  private buffer: ArrayBuffer;
  private view: DataView;

  constructor(buffer: ArrayBuffer) {
    this.buffer = buffer;
    this.view = new DataView(buffer);
  }

  readHeader(): NARCHeader {
    const magic = new TextDecoder().decode(this.buffer.slice(0, 4));
    if (magic !== "NARC") {
      throw new Error("Invalid NARC file");
    }

    return {
      magic,
      byteOrder: this.view.getUint16(0x04, true),
      version: this.view.getUint16(0x06, true),
      fileSize: this.view.getUint32(0x08, true),
      headerSize: this.view.getUint16(0x0C, true),
      sectionCount: this.view.getUint16(0x0E, true)
    };
  }

  readFATB(): FATBSection {
    const magic = new TextDecoder().decode(this.buffer.slice(0x10, 0x14));
    if (magic !== "BTAF") {
      throw new Error("Invalid FATB section");
    }

    const sectionSize = this.view.getUint32(0x14, true);
    const fileCount = this.view.getUint32(0x18, true);
    const entries: FATEntry[] = [];

    let offset = 0x1C;
    for (let i = 0; i < fileCount; i++) {
      entries.push({
        startOffset: this.view.getUint32(offset, true),
        endOffset: this.view.getUint32(offset + 4, true)
      });
      offset += 8;
    }

    return {
      magic,
      sectionSize,
      fileCount,
      entries
    };
  }

  extractFiles(): Uint8Array[] {
    const header = this.readHeader();
    const fatb = this.readFATB();

    // Find FIMG section
    let fimgOffset = 0x10 + fatb.sectionSize;

    // Skip FNTB section
    const fntbSize = this.view.getUint32(fimgOffset + 4, true);
    fimgOffset += fntbSize;

    // Read FIMG magic and skip header
    const fimgMagic = new TextDecoder().decode(this.buffer.slice(fimgOffset, fimgOffset + 4));
    if (fimgMagic !== "GMIF") {
      throw new Error("Invalid FIMG section");
    }

    const fimgDataStart = fimgOffset + 8;
    const files: Uint8Array[] = [];

    for (const entry of fatb.entries) {
      const fileStart = fimgDataStart + entry.startOffset;
      const fileEnd = fimgDataStart + entry.endOffset;
      files.push(new Uint8Array(this.buffer.slice(fileStart, fileEnd)));
    }

    return files;
  }
}
```

### File Type Detection

```typescript
function detectFileType(data: Uint8Array): string {
  if (data.length < 4) return "unknown";

  const magic = new TextDecoder().decode(data.slice(0, 4));

  switch (magic) {
    case "BMD0": return "nsbmd";
    case "BTX0": return "nsbtx";
    case "BCA0": return "nsbca";
    case "BTP0": return "nsbtp";
    case "BTA0": return "nsbta";
    case "NARC": return "narc";
    default: return "unknown";
  }
}

interface ExtractedFile {
  index: number;
  type: string;
  data: Uint8Array;
  size: number;
}

function analyzeNARC(buffer: ArrayBuffer): ExtractedFile[] {
  const reader = new NARCReader(buffer);
  const files = reader.extractFiles();

  return files.map((data, index) => ({
    index,
    type: detectFileType(data),
    data,
    size: data.length
  }));
}
```

### Batch NARC Processing

```typescript
async function processNARCDirectory(inputDir: string, outputDir: string) {
  const files = await readdir(inputDir);

  for (const file of files) {
    if (!file.endsWith('.narc')) continue;

    console.log(`Processing ${file}...`);

    try {
      // Read and decompress ZPR
      const compressedBuffer = readFileSync(join(inputDir, file)).buffer;
      const decompressed = decompressZPR(compressedBuffer);

      if (!decompressed) {
        console.log(`Skipping ${file} - not a ZPR file`);
        continue;
      }

      // Analyze NARC contents
      const extractedFiles = analyzeNARC(decompressed.buffer);

      // Create output directory
      const outputPath = join(outputDir, file.replace('.narc', ''));
      await mkdir(outputPath, { recursive: true });

      // Extract individual files
      for (const extracted of extractedFiles) {
        const extension = extracted.type === "unknown" ? "bin" : extracted.type;
        const filename = `${extracted.index.toString().padStart(2, '0')}.${extension}`;

        writeFileSync(join(outputPath, filename), extracted.data);
        console.log(`  Extracted ${filename} (${extracted.type}, ${extracted.size} bytes)`);
      }

    } catch (error) {
      console.error(`Failed to process ${file}:`, error);
    }
  }
}
```

## File Association Patterns

### Model + Texture Pairs

Environment objects follow predictable naming:
- `o01a_mdl.narc` contains the 3D model
- `o01a_tex.narc` contains the corresponding textures

### Scene Asset Organization

Scene files are organized by area and zone:
- `s01a_*` files belong to Scene 01, Zone A
- Texture files: `s01a_tc3.nsbtx` (loose texture file)
- Model archives: `s01a_tc3.narc` (corresponding model archive)

### Player Asset Naming

Player weapons use descriptive naming:
- Format: `{ID}_{weapon_type}_{class}_{animation_set}.narc`
- Example: `08_handgun_sw_pa00.narc`
  - ID: 08
  - Weapon: handgun
  - Class: sw (sword user variant)
  - Animation set: pa00
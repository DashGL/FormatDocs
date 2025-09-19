# Asset Extraction Guide

## Quick Start

### Prerequisites
- Node.js 18+ or Bun runtime
- TypeScript support
- `apicula` tool for 3D model conversion

### Installation
```bash
# Clone or download the PSZ format documentation
cd PhantasyStarZero/scripts

# Install dependencies (if using npm)
npm install typescript @types/node

# Or use bun for faster execution
bun install
```

### Basic Extraction

#### Single File Extraction
```bash
# Decompress a single ZPR file
npx ts-node zpr-decompress.ts data/player/pb_bird.narc pb_bird_decompressed.narc

# Or with bun
bun zpr-decompress.ts data/player/pb_bird.narc pb_bird_decompressed.narc
```

#### Batch Directory Extraction
```bash
# Extract all player assets
npx ts-node batch-extract.ts data/player extracted/player

# Extract all assets recursively
npx ts-node batch-extract.ts data extracted --recursive

# Extract with custom pattern
npx ts-node batch-extract.ts data/enemy extracted/enemy --pattern "boss_.*\.narc"
```

## Detailed Workflow

### Step 1: ZPR Decompression

All `.narc` files in PSZ are compressed with the ZPR format. First decompress them:

```typescript
import { decompressZPRFile } from './scripts/zpr-decompress';

// Decompress individual file
const success = decompressZPRFile(
  'data/player/08_handgun_sw_pa00.narc',
  'temp/handgun_decompressed.narc'
);

if (success) {
  console.log('Decompression successful');
}
```

### Step 2: NARC Archive Extraction

Extract individual assets from the decompressed NARC:

```typescript
import { NARCExtractor } from './scripts/batch-extract';
import { readFileSync } from 'fs';

// Load decompressed NARC
const narcData = readFileSync('temp/handgun_decompressed.narc').buffer;
const extractor = new NARCExtractor(narcData);

// Get file list
const assets = extractor.extractFiles();
console.log('Found assets:', assets);

// Extract specific file
const modelData = extractor.extractFileData(0); // Usually the 3D model
```

### Step 3: 3D Model Conversion

Convert Nintendo DS formats to modern formats using apicula:

```bash
# Convert NSBMD to COLLADA (.dae)
apicula convert extracted/handgun/00.nsbmd -o converted/handgun

# Convert to glTF/GLB format
apicula convert extracted/handgun/00.nsbmd -f glb -o converted/handgun
```

## Asset Type Processing

### Weapons

Weapon archives contain multiple related files:

```typescript
interface WeaponAssets {
  model: string;      // File 00: .nsbmd
  animation: string;  // File 01: .nsbca
  texture: string;    // File 02: .nsbtx (optional)
}

async function processWeapon(weaponNarc: string, outputDir: string) {
  // 1. Decompress ZPR
  const decompressed = `${outputDir}/temp.narc`;
  await decompressZPRFile(weaponNarc, decompressed);

  // 2. Extract NARC contents
  const result = await processZPRFile(weaponNarc, outputDir);

  // 3. Convert 3D assets
  const weaponDir = join(outputDir, basename(weaponNarc, '.narc'));

  // Convert model
  if (existsSync(join(weaponDir, '00.nsbmd'))) {
    await exec(`apicula convert ${join(weaponDir, '00.nsbmd')} -f glb -o ${weaponDir}`);
  }

  return result;
}
```

### Enemies

Enemy processing with multiple animations:

```typescript
async function processEnemy(enemyNarc: string, outputDir: string) {
  const result = await processZPRFile(enemyNarc, outputDir);
  const enemyDir = join(outputDir, basename(enemyNarc, '.narc'));

  // Find all animation files
  const animFiles = result.extractedFiles.filter(f => f.type === 'nsbca');

  console.log(`Found ${animFiles.length} animation files for enemy`);

  // Convert model with all animations
  if (existsSync(join(enemyDir, '00.nsbmd'))) {
    await exec(`apicula convert ${join(enemyDir, '00.nsbmd')} -f glb -o ${enemyDir} --all-animations`);
  }

  return result;
}
```

### Environment Objects

Process paired model/texture files:

```typescript
async function processEnvironmentPair(modelNarc: string, textureNarc: string, outputDir: string) {
  const baseName = basename(modelNarc, '_mdl.narc');
  const pairDir = join(outputDir, baseName);

  // Extract model archive
  const modelResult = await processZPRFile(modelNarc, pairDir);

  // Extract texture archive
  const textureResult = await processZPRFile(textureNarc, pairDir);

  // Combine assets for conversion
  // The apicula tool will automatically find matching textures
  await exec(`apicula convert ${pairDir}/model/00.nsbmd -o ${pairDir} --more-textures`);

  return { model: modelResult, texture: textureResult };
}
```

## Automation Scripts

### Complete Asset Pipeline

```typescript
#!/usr/bin/env bun

import { batchExtractDirectory, generateExtractionReport } from './batch-extract';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function fullExtractionPipeline(dataDir: string, outputDir: string) {
  console.log('🚀 Starting full PSZ asset extraction pipeline...');

  // Step 1: Extract all ZPR archives
  console.log('📦 Extracting ZPR archives...');
  const results = await batchExtractDirectory(dataDir, join(outputDir, 'extracted'), {
    recursive: true,
    verbose: true
  });

  // Step 2: Generate report
  const report = generateExtractionReport(results);
  await writeFileSync(join(outputDir, 'extraction-report.md'), report);

  // Step 3: Convert 3D assets
  console.log('🎨 Converting 3D assets...');
  await convertAllModels(join(outputDir, 'extracted'), join(outputDir, 'converted'));

  // Step 4: Organize by category
  console.log('📁 Organizing assets by category...');
  await organizeAssetsByCategory(join(outputDir, 'converted'), join(outputDir, 'organized'));

  console.log('✅ Pipeline complete!');
}

async function convertAllModels(extractedDir: string, convertedDir: string) {
  const { stdout } = await execAsync(`find ${extractedDir} -name "*.nsbmd"`);
  const modelFiles = stdout.trim().split('\n').filter(Boolean);

  for (const modelFile of modelFiles) {
    try {
      const relativePath = path.relative(extractedDir, modelFile);
      const outputPath = join(convertedDir, path.dirname(relativePath));

      await execAsync(`apicula convert "${modelFile}" -f glb -o "${outputPath}" --overwrite`);
      console.log(`✅ Converted: ${relativePath}`);
    } catch (error) {
      console.log(`❌ Failed to convert: ${modelFile}`);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const [dataDir, outputDir] = process.argv.slice(2);

  if (!dataDir || !outputDir) {
    console.log('Usage: bun full-pipeline.ts <data-dir> <output-dir>');
    process.exit(1);
  }

  fullExtractionPipeline(dataDir, outputDir).catch(console.error);
}
```

### Asset Organization

```typescript
async function organizeAssetsByCategory(convertedDir: string, organizedDir: string) {
  const categories = {
    weapons: 'player/*handgun*|*sword*|*gun*|*spear*|*claw*',
    enemies: 'enemy/*',
    environments: 'object/*|scene/*',
    ui: 'sprite/*'
  };

  for (const [category, pattern] of Object.entries(categories)) {
    const categoryDir = join(organizedDir, category);
    await mkdir(categoryDir, { recursive: true });

    // Move matching files
    const { stdout } = await execAsync(`find ${convertedDir} -path "*${pattern}*" -name "*.glb"`);
    const files = stdout.trim().split('\n').filter(Boolean);

    for (const file of files) {
      const destPath = join(categoryDir, basename(file));
      await execAsync(`cp "${file}" "${destPath}"`);
    }

    console.log(`📁 Organized ${files.length} ${category} assets`);
  }
}
```

## Troubleshooting

### Common Issues

#### ZPR Decompression Fails
```typescript
// Check file magic header
const buffer = readFileSync('problem-file.narc');
const magic = buffer.slice(0, 4).toString();
console.log('Magic:', magic); // Should be "ZPR\0"

// Check file size
console.log('Size:', buffer.length); // Should be > 16 bytes
```

#### NARC Extraction Fails
```typescript
// Verify NARC header after decompression
const decompressed = decompressZPR(buffer);
if (decompressed) {
  const narcMagic = new TextDecoder().decode(decompressed.slice(0, 4));
  console.log('NARC magic:', narcMagic); // Should be "NARC"
}
```

#### Model Conversion Issues
```bash
# Check if apicula can read the file
apicula info extracted/model/00.nsbmd

# Try different output formats
apicula convert extracted/model/00.nsbmd -f dae -o output/
apicula convert extracted/model/00.nsbmd -f gltf -o output/
```

### Performance Tips

#### Batch Processing
- Use `bun` instead of `node` for ~3x faster execution
- Process files in parallel where possible
- Skip already processed files

#### Memory Management
```typescript
// Process large directories in chunks
async function processInChunks<T>(items: T[], chunkSize: number, processor: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await Promise.all(chunk.map(processor));
  }
}
```

## Output Structure

The extraction process creates the following directory structure:

```
output/
├── extracted/           # Raw extracted assets
│   ├── player/
│   ├── enemy/
│   └── scene/
├── converted/          # 3D models in modern formats
│   ├── models/
│   ├── textures/
│   └── animations/
├── organized/          # Assets organized by type
│   ├── weapons/
│   ├── enemies/
│   ├── environments/
│   └── ui/
└── reports/
    ├── extraction-report.md
    ├── conversion-log.txt
    └── asset-catalog.json
```
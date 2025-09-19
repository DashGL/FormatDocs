# Phantasy Star Zero (DS) File Format Documentation

This documentation covers the file formats and structure used in Phantasy Star Zero for Nintendo DS.

## Overview

Phantasy Star Zero uses a custom compression format called "ZPR" to compress most of its assets, particularly NARC archives containing 3D models, textures, animations, and other game data.

## Directory Structure

```
/data/
├── player/          # Player character assets, weapons, animations
├── enemy/           # Enemy models, animations, AI data
├── scene/           # Environment assets by area (00-08)
├── object/          # Interactive objects and props
├── item/            # Item drops organized by difficulty
├── sprite/          # 2D UI graphics and sprites
├── common/          # Shared assets
├── sound/           # Audio files
├── movie/           # Cutscene data
├── quest/           # Quest data and scripts
├── event/           # Event triggers and data
└── set/             # Level/area configuration
```

## File Format Categories

### Primary Archive Format
- **NARC** - Nintendo Archive files (compressed with ZPR)
- **ZARC** - Custom archive format for textures

### 3D Assets
- **NSBMD** - 3D Models (BMD0 header)
- **NSBTX** - Textures (BTX0 header)
- **NSBCA** - Skeletal Animations (BCA0 header)
- **NSBTP** - Pattern Animations (BTP0 header)
- **NSBTA** - Material Animations (BTA0 header)

### 2D Assets
- **NCGR** - Character Graphics
- **NCLR** - Color Palettes
- **NSCR** - Screen Data
- **NCER** - Cell Banks

## Asset Organization Patterns

### Player Assets (`/data/player/`)
- **Weapons**: 16+ weapon types with naming pattern `{ID}_{weapon}_{class}_{animation}.narc`
  - Example: `08_handgun_sw_pa00.narc` (handgun for sword class, animation 00)
- **Character Textures**: `player_{ID}_tex.zarc` format
- **Companion**: `pb_bird.narc` (player bird companion)

### Enemy Assets (`/data/enemy/`)
- **Boss Enemies**: `boss_{type}.narc` (dragon, octopus, robot)
- **Regular Enemies**: Individual `.narc` files per enemy type
- **Rare Variants**: `{enemy}_rare.narc` format
- **Deployment**: Organized in `deploy/` subdirectories by area

### Environment Assets
- **Scenes** (`/data/scene/`): Organized as `{area}/{zone}/` (e.g., `01/a/`, `01/b/`)
- **Objects** (`/data/object/`): Numbered directories (00-08, special)
- **File Pairs**: Models and textures follow `{prefix}_mdl.narc` + `{prefix}_tex.narc` pattern

## File Format Details

- [ZPR Compression Format](./ZPR-Format.md)
- [NARC Archive Structure](./NARC-Format.md)
- [Asset Extraction Guide](./Extraction-Guide.md)
- [3D Model Conversion](./Model-Conversion.md)

## Tools and Scripts

- [ZPR Decompression Script](./scripts/zpr-decompress.ts)
- [Asset Batch Processor](./scripts/batch-extract.ts)
- [File Type Analyzer](./scripts/analyze-assets.ts)

## Statistics

- **NARC Archives**: 758 compressed files
- **Texture Files**: 324 .nsbtx files
- **3D Models**: 4 direct .nsbmd files (mostly in compressed archives)
- **Animations**: 1 direct .nsbca file + embedded in archives
- **Total Asset Count**: 1000+ individual assets across all categories
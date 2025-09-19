# Phantasy Star Zero Asset Categories

## Overview

This document details the categorization and organization of assets in Phantasy Star Zero, including file naming conventions, content patterns, and relationships between different asset types.

## Asset Type Hierarchy

```
PSZ Assets
├── 3D Assets
│   ├── Characters (Player, NPCs, Enemies)
│   ├── Weapons & Equipment
│   ├── Environment Objects
│   └── Effects & Particles
├── 2D Assets
│   ├── UI Graphics
│   ├── Textures
│   └── Sprites
├── Audio Assets
│   ├── Music
│   ├── Sound Effects
│   └── Voice
└── Data Assets
    ├── Game Logic
    ├── Quest Data
    └── Configuration
```

## Directory-Based Categories

### Player Assets (`/data/player/`)

#### Weapon Archives
Weapons are organized by type and class compatibility:

| Weapon Type | Classes | File Pattern | Content |
|-------------|---------|--------------|---------|
| Saber | M, W, SW | `01_saber_{class}_pa{##}.narc` | Model + Animations |
| Sword | M, W, SW | `02_sword_{class}_pa{##}.narc` | Model + Animations |
| Dagger | M, W, SW | `03_dagger_{class}_pa{##}.narc` | Model + Animations |
| Spear | M, W, SW | `04_spear_{class}_pa{##}.narc` | Model + Animations |
| Claw | M, W, SW | `05_claw_{class}_pa{##}.narc` | Model + Animations |
| Shield | SM, SW | `06_shield_{class}_pa{##}.narc` | Model + Animations |
| Double Saber | SM, SW | `07_d_saver_{class}_pa{##}.narc` | Model + Animations |
| Handgun | SM, SW | `08_handgun_{class}_pa{##}.narc` | Model + Animations |
| Rifle | SM, SW | `09_rifle_{class}_pa{##}.narc` | Model + Animations |
| Shotgun | SM, SW | `10_shotgun_{class}_pa{##}.narc` | Model + Animations |
| Machine Gun | M, W, SM, SW | `11_machinegun_{class}_pa{##}.narc` | Model + Animations |
| Cannon | SM, SW | `12_cannon_{class}_pa{##}.narc` | Model + Animations |
| Laser Cannon | SM, SW | `13_l_cannon_{class}_pa{##}.narc` | Model + Animations |
| Photon Launcher | SM, SW | `14_launcher_{class}_pa{##}.narc` | Model + Animations |
| Wand | SM, SW | `15_wand_{class}_pa{##}.narc` | Model + Animations |
| Slicer | SM, SW | `16_slicer_{class}_pa{##}.narc` | Model + Animations |

#### Class Abbreviations
- **M**: Male (Hunter)
- **W**: Female (Hunewearl)
- **SM**: Male Cast (Racast)
- **SW**: Female Cast (Racaseal)

#### Animation Sets
- **pa00**: Basic attack animations
- **pa01**: Secondary attack set
- **pa02**: Special/charged attacks

#### Character Textures
```typescript
interface PlayerTexture {
  pattern: "player_{ID}_tex.zarc";
  examples: [
    "player_051_tex.zarc", // Character variant 51
    "player_073_tex.zarc", // Character variant 73
    "player_103_tex.zarc"  // Character variant 103
  ];
  content: "Character skin textures and variations";
}
```

### Enemy Assets (`/data/enemy/`)

#### Boss Enemies
| File Name | Enemy Type | Description |
|-----------|------------|-------------|
| `boss_dragon.narc` | Dragon | Large flying boss |
| `boss_octopus.narc` | Octopus | Aquatic boss enemy |
| `boss_robot.narc` | Robot | Mechanical boss |
| `boss_robot_cmb.narc` | Robot Combo | Combined robot form |

#### Regular Enemies
| File Name | Enemy Type | Description |
|-----------|------------|-------------|
| `vulture.narc` | Flying | Aerial enemy |
| `rabbit.narc` | Small | Ground mammal enemy |
| `tank.narc` | Heavy | Armored ground unit |
| `seal.narc` | Aquatic | Water-based enemy |
| `swordman.narc` | Humanoid | Melee combat enemy |
| `frog.narc` | Amphibian | Water/land enemy |
| `roc.narc` | Flying | Large bird enemy |
| `circle.narc` | Mechanical | Floating robot |
| `board_blue.narc` | Mechanical | Hoverboard unit |
| `jigobooma.narc` | Unique | Special enemy type |

#### Rare Variants
Most enemies have rare versions with enhanced stats:
- `{enemy}_rare.narc` (e.g., `rabbit_rare.narc`, `tank_rare.narc`)

#### Enemy Deployment
Enemies are deployed per area in `/data/enemy/deploy/`:
```
deploy/
├── f3/           # Floor/Area 3
│   ├── s02a_xb2.rel
│   └── s05b_na1.rel
└── [other areas]
```

### Environment Assets

#### Scene Assets (`/data/scene/`)
Organized by area and zone:

```
scene/
├── 00/           # Lobby/Hub area
├── 01/           # Forest area
├── 03/           # Cave area
├── 05/           # Ruins area
└── 08/           # Special areas
    ├── 0/, 1/, 2/, etc.  # Sub-zones
    ├── a/, b/            # Main zones
    ├── e/                # Event zones
    └── z/                # Boss zones
```

#### Scene File Types
Each zone contains:
- **Texture files**: `s{area}{zone}_{code}.nsbtx`
- **Model archives**: `s{area}{zone}_{code}.narc`

Example for Scene 01, Zone A:
```
s01a_tc3.nsbtx    # Texture file
s01a_tc3.narc     # Model archive
s01a_ib2.nsbtx    # Additional texture
s01a_ib2.narc     # Additional models
```

#### Object Assets (`/data/object/`)
Interactive environment objects:

```typescript
interface ObjectAssetPair {
  model: string;      // "o{area}{zone}_mdl.narc"
  texture: string;    // "o{area}{zone}_tex.narc"
  parameters: string; // "o{area}{zone}_prm.rel"
}

// Examples:
const objects = [
  {
    model: "o01a_mdl.narc",
    texture: "o01a_tex.narc",
    parameters: "o01a_prm.rel"
  },
  {
    model: "o03b_mdl.narc",
    texture: "o03b_tex.narc",
    parameters: "o03b_prm.rel"
  }
];
```

### Item Assets (`/data/item/`)

#### Drop Items
Organized by difficulty level:

| Difficulty | File Pattern | Item Types |
|------------|--------------|------------|
| Normal | `normal{1-8}.narc` | Basic weapons, armor |
| Hard | `hard{1-5}.narc` | Enhanced equipment |
| Very Hard | `v_hard{1-8}.narc` | Rare items, special weapons |

#### Effect Archives
- `paeff{05,11,12}.rel` - Particle effect definitions
- `wpnprm.rel` - Weapon parameters

### UI Assets (`/data/sprite/`)

#### 2D Graphics
| File Type | Purpose | Examples |
|-----------|---------|----------|
| `.NCGR` | Graphics | `bg_s01.NCGR` (Scene 01 background) |
| `.NCLR` | Palettes | `bg_s01.NCLR` (Scene 01 colors) |
| `.NSCR` | Screen Data | `bg_s01.NSCR` (Scene 01 layout) |
| `.bin` | Text Data | `game_menu_text.bin` |

## Asset Relationship Patterns

### Model-Texture Associations

#### Explicit Pairs
```typescript
interface AssetPair {
  model: string;
  texture: string;
  relationship: "explicit";
}

// Environment objects
const explicitPairs: AssetPair[] = [
  { model: "o01a_mdl.narc", texture: "o01a_tex.narc", relationship: "explicit" },
  { model: "o01b_mdl.narc", texture: "o01b_tex.narc", relationship: "explicit" }
];
```

#### Embedded Associations
```typescript
interface EmbeddedAsset {
  archive: string;
  contains: string[];
  relationship: "embedded";
}

// Weapons contain model + texture + animation
const embeddedAssets: EmbeddedAsset[] = [
  {
    archive: "08_handgun_sw_pa00.narc",
    contains: ["model.nsbmd", "animation.nsbca", "texture.nsbtx"],
    relationship: "embedded"
  }
];
```

#### Scene Associations
```typescript
interface SceneAssetGroup {
  area: string;
  zone: string;
  textures: string[];
  models: string[];
}

// Scene assets are grouped by area/zone
const sceneGroups: SceneAssetGroup[] = [
  {
    area: "01",
    zone: "a",
    textures: ["s01a_tc3.nsbtx", "s01a_ib2.nsbtx"],
    models: ["s01a_tc3.narc", "s01a_ib2.narc"]
  }
];
```

## Content Analysis Patterns

### Weapon Archive Structure
```typescript
interface WeaponArchive {
  file00: "NSBMD";  // 3D weapon model
  file01: "NSBCA";  // Weapon animations
  file02: "NSBTX";  // Weapon textures
}
```

### Enemy Archive Structure
```typescript
interface EnemyArchive {
  file00: "NSBMD";  // Enemy model
  file01: "NSBCA";  // Movement animations
  file02?: "NSBCA"; // Attack animations
  file03?: "NSBTX"; // Enemy textures
  file04?: "binary"; // AI parameters
}
```

### Environment Archive Structure
```typescript
interface EnvironmentArchive {
  file00: "NSBMD";  // Object model
  file01?: "NSBTX"; // Object textures
  file02?: "NSBTP"; // Pattern animations
  file03?: "NSBTA"; // Material animations
}
```

## Conversion Workflow

### 1. Asset Discovery
```typescript
async function discoverAssets(dataDir: string): Promise<AssetCatalog> {
  const catalog: AssetCatalog = {
    players: await scanDirectory(join(dataDir, "player")),
    enemies: await scanDirectory(join(dataDir, "enemy")),
    scenes: await scanDirectory(join(dataDir, "scene")),
    objects: await scanDirectory(join(dataDir, "object")),
    items: await scanDirectory(join(dataDir, "item"))
  };

  return catalog;
}
```

### 2. Asset Grouping
```typescript
function groupRelatedAssets(catalog: AssetCatalog): AssetGroup[] {
  const groups: AssetGroup[] = [];

  // Group model/texture pairs
  for (const model of catalog.objects.filter(f => f.includes("_mdl"))) {
    const baseName = model.replace("_mdl.narc", "");
    const texture = `${baseName}_tex.narc`;

    if (catalog.objects.includes(texture)) {
      groups.push({
        type: "object",
        name: baseName,
        files: [model, texture]
      });
    }
  }

  return groups;
}
```

### 3. Batch Conversion
```typescript
async function convertAssetGroup(group: AssetGroup, outputDir: string) {
  const groupDir = join(outputDir, group.type, group.name);
  await mkdir(groupDir, { recursive: true });

  for (const file of group.files) {
    await processZPRFile(file, groupDir);
  }

  // Convert to modern formats using apicula
  await convertToGLB(groupDir);
}
```
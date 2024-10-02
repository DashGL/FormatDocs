---
title: Overview
description: A description of the mesh format used for the player character
---

## Game Overview

MegaMan Legends is a unique 3D action-adventure game, released across multiple platforms: PSX, PSP (Japan-only), and PC (Japan-only). This documentation focuses primarily on the **PSX version**, as it is the most widely available version.

The **PSX version** is organized into two main folders: `DAT` and `COMMON`, where most of the game's assets are stored.

While the **PC version** uses a different archive format, the actual game data in the PC version shares similarities with the PSX version, especially the internal assets (such as meshes, textures, etc.).

The **PSP version** contains mostly the same assets as the PSX version, with some Japan-exclusive side content.

## PSX Version: File Structure

On the PSX game disc, the game files are organized as follows:

- **ROCK_NEO.EXE**: The main game executable.
- **COMMON Folder**: Contains the player character mesh, the title screen assets, and UI sprites such as the pause menu.
- **DAT Folder**: Contains assets broken down by scenes, such as stage models, enemy meshes, NPC data, and textures.

### COMMON Folder

The `COMMON` folder holds data that is reused across multiple scenes. Some of the notable assets include:
- **Player Character Mesh (MegaMan)**: This is where the player character's 3D model is stored.
- **Title Screen**: Assets for the game's title screen are contained here.
- **Sprites and UI Elements**: Common sprites, such as those used in the pause menu, are also found here.

### DAT Folder

The `DAT` folder is structured around scenes in the game. Each scene is broken into multiple acts. For example:
- **Scene 3**: Contains Act 0, Act 1, Act 2, Act 3, Act 4, and Act 5.
  - Each act contains specific models and textures for that scene.
  - **Duplicated Assets**: Meshes and textures are often duplicated between acts to allow the game to load data sequentially into memory, avoiding issues with limited RAM on the PSX.

  ## File Format Documentation

  ### Mesh Formats
  The mesh format used for 3D models in MegaMan Legends typically follows this structure:
  - **PBD** Mesh Data for the player character
  - **EBD** Mesh Data for the scene entities

  ### Texture Formats
  Textures are stored as compressed images. The compression algorithm used on the PSX version is unique to the hardware, requiring custom decompression scripts.

  - **TIM** Texture format for the PlayStation, uses the same elements packed differently
    - Image + Palette compressed
    - Image + Palette uncompressed
    - Image Compressed
    - Palette Only Uncompressed

  ### Compression Formats
  The game uses a variety of compression techniques to store data efficiently on the disc. Some of these include:
  - **LZ77r Compression**: Modified version of an LZ77 with a fixed `0x2000` byte window size

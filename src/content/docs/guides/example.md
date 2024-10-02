---
title: PlayStation
description: A summary of how to approach reverse engineering with PlayStation Emulation and Tools
---

In this guide, we’ll explore methods to debug and update the files in **PlayStation Games**. These methods focus on using memory editing tools to analyze how the game works and updating game files to modify assets or content.

## Memory
One of the best approaches for debugging **PlayStation Games** and understanding how it works is through memory analysis. This section explains how to extract and modify the game’s memory to experiment with in-game changes.
### Steps for Debugging with Memory

1. **Choose an Emulator**:
The recommended emulators for memory analysis are:
- **DuckStation**
- **PCSXR**
- **RetroArch**

2. **Create a Save State**:
  - Play the game until you reach the point where you want to investigate or modify in-game data.
  - Create a save state using the emulator (usually accessible from the emulator’s menu).
3. **Dump the Memory from the Save State**:
  - Save states include a snapshot of the game’s memory at a specific point. By dumping the save state, you gain access to the current memory values.
  - Use tools specific to each emulator to extract the memory from the save state.
4. **Analyze and Edit the Memory**:
  - Open the dumped memory in a hex editor or reverse-engineering tool like **hx**.
  - This will allow you to make changes or look through the memory by writing your own scripts or analysis
5. **Reload the Edited Save State**:
  - Once you have edited the memory, reload the modified save state in the emulator.
  - The game should reflect the changes made to the memory, allowing you to see the effects in real-time.This process can be repeated for testing new ideas, finding data structures, or experimenting with gameplay changes.


## Files
Modifying the game files is a more direct approach to updating assets, models, textures, and even scripts in **PlayStation Games**. The following section outlines how to extract, modify, and rebuild the game files.

### Steps for Modifying Game Files

1. **Dump the Game Files**:
To access the raw files within the PSX version of the game, use a tool called **mkpsxiso**. This tool extracts the contents of the PSX ROM (ISO) into a manageable format.
  - First, run `mkpsxiso` to dump all the files from the original ROM.
  - The tool will generate an **XML file** that defines the order of the files and how they are organized on the disc.
2. **Rebuild the Game ROM**:
After making modifications to the game files:
  - Use `mkpsxiso` again to rebuild the ISO, ensuring that the **XML file** matches the original file order.
  - The tool will pack the updated files back into the ISO format.
3. **Test the Modified ROM**:
  - Load the rebuilt ROM into an emulator (e.g., DuckStation, PCSXR, or RetroArch).
  - Test the changes to ensure the modifications work correctly and the game behaves as expected.By following these steps, you can modify various aspects of the game, such as textures, models, or even gameplay scripts.


## Tools
Here’s a list of tools mentioned in this guide to help with memory analysis and file modification:
- **Emulators**:
  - [DuckStation](https://github.com/stenzek/duckstation)
  - [PCSXR](https://ps1emulator.com/)
  - [RetroArch](https://www.retroarch.com/)
  - [no$psx](https://problemkaputt.de/psx.htm)
- **SaveState Editing Tools**:
  - [hx](https://github.com/krpors/hx): Simple vim-like hex editor for the command line
  - [ImHex](https://github.com/WerWolv/ImHex): Command Line hex editor built for reverse engineering
- **File Dumping and Rebuilding**:
  - [mkpsxiso](https://github.com/Lameguy64/mkpsxiso): Tool for dumping and rebuilding PSX ISOs.
- **Courses and Articles**:
  - [PS1 Programming with MIPS Assembly & C](https://pikuma.com/courses/ps1-programming-mips-assembly-language)
  - [How PlayStation Graphics & Visual Artefacts Work](https://pikuma.com/blog/how-to-make-ps1-graphics)

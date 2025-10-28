# Grid-Based Map Editor
A lightweight desktop application for creating 2D game maps with a grid-based tile system, designed specifically for PlayStation 1 homebrew development.

<img width="825" height="523" alt="screenshot-map-editor" src="https://github.com/user-attachments/assets/aa0de2fe-e809-4ddb-b1bd-f8d190909e1b" />

## Features

- Import image files as tiles
- Place tiles on a grid canvas
- Assign custom IDs to tiles
- Configure tile alignment (horizontal: left/center/right, vertical: top/middle/bottom)
- Optional black transparency for tiles
- Customizable background color
- Grid lines toggle for better visibility
- Smart rectangle detection for efficient map exports
- Save and load project files (.mapproj)
- Export maps to .map format with rectangle optimization (TILE_ID X Y REPEATS_X REPEATS_Y)
- Pan the canvas (Shift + Left click or Middle mouse)
- Visual selection indicator for active tile

## Getting Started

### Prerequisites

- Node.js (v16+)
- Rust and Cargo
- Platform-specific dependencies:
  - Linux: webkit2gtk (see [Tauri prerequisites](https://tauri.app/guides/prerequisites/#linux))
  - macOS/Windows: See Tauri prerequisites

### Installation

1. Navigate to the map-editor directory:
   ```bash
   cd map-editor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in development mode:
   ```bash
   npm run tauri dev
   ```

4. Build for production:
   ```bash
   npm run tauri build
   ```

## How to Use

### 1. Import Images
- Click "Import Images" button in the toolbar
- Select one or more image files (PNG, JPG, GIF, BMP, WEBP)
- Each image becomes a tile with an ID based on its filename

### 2. Configure Tiles
- In the Tile Palette (right side), you can customize each tile:
  - **ID**: Click on the text field to change the tile ID (e.g., "STONE", "TREE", "WALL")
  - **Alignment**: Set horizontal (left/center/right) and vertical (top/middle/bottom) alignment
  - **Black Transparency**: Toggle to make black pixels transparent
  - The tile ID will be used in the exported .map file

### 3. Place Tiles
- Click on a tile in the palette to select it (it will be highlighted in blue)
- Left click on the canvas to place the selected tile
- The tile will snap to the grid

### 4. Delete Tiles
- Right click on any placed tile to delete it

### 5. Pan the Canvas
- Hold Shift and drag with left mouse button, OR
- Use middle mouse button to drag

### 6. Save Your Work
- Click "Save" to save your project as a .mapproj file
- This saves all tiles, placements, and settings
- You can reopen this file later to continue editing

### 7. Load a Project
- Click "Open" to load a previously saved .mapproj file

### 8. Export Map
- Click "Export .map" to export your map
- The editor automatically detects rectangular tile patterns and exports them efficiently
- See the "Map File Format" section below for details on the export format

### 9. New Project
- Click "New" to start a fresh project
- Warning: This will clear your current work

## File Formats

### Project File (.mapproj)
JSON format containing:
- Grid size
- All imported tiles (with image data, alignment settings, transparency options)
- All placed tiles (position and ID)
- Background color

### Map File Format (.map)

Each line in a .map file represents one or more tiles in a rectangular pattern:

```
<TILE_ID> <X> <Y> <REPEATS_X> <REPEATS_Y>
```

**Parameters:**
- `TILE_ID`: String identifier for the tile type (e.g., "STONE", "TREE", "WALL")
- `X`: Starting X coordinate (in grid units)
- `Y`: Starting Y coordinate (in grid units)
- `REPEATS_X`: Number of horizontal repetitions (width of rectangle)
- `REPEATS_Y`: Number of vertical repetitions (height of rectangle)

**Example:**
```
STONE 230 340 1 1
TREE 320 333 1 1
WALL 10 5 3 4
```

This creates:
- 1 STONE tile at position (230, 340)
- 1 TREE tile at position (320, 333)
- A 3×4 rectangle of WALL tiles starting at position (10, 5)

**Rectangle Detection:**
The editor automatically detects when you place tiles in rectangular patterns and exports them efficiently. For example, if you manually place 12 WALL tiles in a 3×4 grid pattern, the editor will export this as a single line with `REPEATS_X=3` and `REPEATS_Y=4` instead of 12 separate lines.

## Keyboard/Mouse Controls

| Action | Control |
|--------|---------|
| Place tile | Left click |
| Delete tile | Right click |
| Pan canvas | Shift + Left drag OR Middle mouse drag |
| Select tile | Click tile in palette |
| Toggle gridlines | Click "Show Gridlines" checkbox in toolbar |
| Change background color | Click color picker in toolbar |

## Project Structure

```
map-editor/
├── src/                    # React frontend
│   ├── components/         # UI components
│   │   ├── GridCanvas.tsx  # Main canvas editor
│   │   ├── TilePalette.tsx # Tile selector
│   │   └── Toolbar.tsx     # Top toolbar
│   ├── types.ts           # TypeScript types
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Entry point
├── src-tauri/             # Rust backend
│   └── src/
│       └── lib.rs         # Tauri commands
└── package.json
```

## Technology Stack

- **Frontend**: React + TypeScript + HTML5 Canvas
- **Backend**: Tauri (Rust)
- **Build Tool**: Vite

## Tips

- Grid size is 16x16 pixels by default
- Tile coordinates are in grid units (not pixels)
- Images are automatically resized to fit the grid
- You can configure tile settings at any time, even after placing tiles
- Pan around the canvas to create larger maps
- Use gridlines to help with precise tile placement
- The background color only affects the editor view, not the exported map
- Rectangle detection works best when tiles are placed in contiguous rectangular patterns
- Tile alignment options help position sprites within grid cells (useful for different sized graphics)

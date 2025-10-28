import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { Toolbar } from "./components/Toolbar";
import { GridCanvas } from "./components/GridCanvas";
import { TilePalette } from "./components/TilePalette";
import { MapProject, Tile, PlacedTile, HorizontalAlign, VerticalAlign } from "./types";
import "./App.css";

function App() {
  const [gridSize] = useState(16);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [placedTiles, setPlacedTiles] = useState<PlacedTile[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState("#2a2a2a");
  const [showGridlines, setShowGridlines] = useState(true);

  const handleNew = () => {
    if (confirm("Create a new project? This will clear your current work.")) {
      setTiles([]);
      setPlacedTiles([]);
      setSelectedTileId(null);
      setBackgroundColor("#2a2a2a");
    }
  };

  const handleImportImages = async () => {
    const selected = await open({
      multiple: true,
      filters: [
        {
          name: "Images",
          extensions: ["png", "jpg", "jpeg", "gif", "bmp", "webp"],
        },
      ],
    });

    if (selected && Array.isArray(selected)) {
      const newTiles: Tile[] = [];
      const existingImageData = new Set(tiles.map(t => t.imageData));

      for (const filePath of selected) {
        try {
          const imageData = await invoke<string>("read_image_as_base64", {
            path: filePath,
          });

          // Skip if this image data already exists
          if (existingImageData.has(imageData)) {
            continue;
          }

          const fileName = filePath.split(/[\\/]/).pop() || "TILE";
          const tileId = fileName.split(".")[0].toUpperCase();

          newTiles.push({
            id: tileId,
            imagePath: filePath,
            imageData,
          });

          // Add to set to prevent duplicates within the same import batch
          existingImageData.add(imageData);
        } catch (error) {
          console.error("Failed to load image:", error);
        }
      }

      setTiles([...tiles, ...newTiles]);
      if (newTiles.length > 0 && !selectedTileId) {
        setSelectedTileId(newTiles[0].id);
      }
    }
  };

  const handlePlaceTile = (x: number, y: number) => {
    if (!selectedTileId) return;

    // Remove existing tile at this position
    const filtered = placedTiles.filter((t) => t.x !== x || t.y !== y);

    // Add new tile
    setPlacedTiles([...filtered, { tileId: selectedTileId, x, y }]);
  };

  const handleDeleteTile = (x: number, y: number) => {
    setPlacedTiles(placedTiles.filter((t) => t.x !== x || t.y !== y));
  };

  const handleEditTileId = (oldId: string, newId: string) => {
    // Update tile ID
    setTiles(
      tiles.map((t) => (t.id === oldId ? { ...t, id: newId } : t))
    );

    // Update placed tiles
    setPlacedTiles(
      placedTiles.map((pt) =>
        pt.tileId === oldId ? { ...pt, tileId: newId } : pt
      )
    );

    // Update selected tile
    if (selectedTileId === oldId) {
      setSelectedTileId(newId);
    }
  };

  const handleEditTileAlignment = (
    tileId: string,
    horizontalAlign: HorizontalAlign,
    verticalAlign: VerticalAlign
  ) => {
    setTiles(
      tiles.map((t) =>
        t.id === tileId ? { ...t, horizontalAlign, verticalAlign } : t
      )
    );
  };

  const handleToggleBlackTransparent = (tileId: string) => {
    setTiles(
      tiles.map((t) =>
        t.id === tileId ? { ...t, blackTransparent: !t.blackTransparent } : t
      )
    );
  };

  const handleSave = async () => {
    const filePath = await save({
      filters: [
        {
          name: "Map Project",
          extensions: ["mapproj"],
        },
      ],
      defaultPath: "project.mapproj",
    });

    if (filePath) {
      const project: MapProject = {
        gridSize,
        tiles,
        placedTiles,
        backgroundColor,
      };

      try {
        await invoke("save_project", {
          path: filePath,
          content: JSON.stringify(project, null, 2),
        });
        alert("Project saved successfully!");
      } catch (error) {
        alert("Failed to save project: " + error);
      }
    }
  };

  const handleOpen = async () => {
    const selected = await open({
      filters: [
        {
          name: "Map Project",
          extensions: ["mapproj"],
        },
      ],
    });

    if (selected && typeof selected === "string") {
      try {
        const content = await invoke<string>("load_project", {
          path: selected,
        });

        const project: MapProject = JSON.parse(content);
        setTiles(project.tiles);
        setPlacedTiles(project.placedTiles);
        setBackgroundColor(project.backgroundColor || "#2a2a2a");

        if (project.tiles.length > 0) {
          setSelectedTileId(project.tiles[0].id);
        }

        alert("Project loaded successfully!");
      } catch (error) {
        alert("Failed to load project: " + error);
      }
    }
  };

  const detectRectangularRepetition = (
    startTile: PlacedTile,
    tileMap: Map<string, PlacedTile>
  ): { repeatsX: number; repeatsY: number } => {
    const { tileId, x, y } = startTile;

    // Find maximum horizontal repetition
    let repeatsX = 1;
    while (true) {
      const key = `${x + repeatsX},${y}`;
      const nextTile = tileMap.get(key);
      if (!nextTile || nextTile.tileId !== tileId) break;
      repeatsX++;
    }

    // Find maximum vertical repetition
    let repeatsY = 1;
    while (true) {
      const key = `${x},${y + repeatsY}`;
      const nextTile = tileMap.get(key);
      if (!nextTile || nextTile.tileId !== tileId) break;
      repeatsY++;
    }

    // Verify the entire rectangle is filled with the same tile
    for (let dy = 0; dy < repeatsY; dy++) {
      for (let dx = 0; dx < repeatsX; dx++) {
        const key = `${x + dx},${y + dy}`;
        const tile = tileMap.get(key);
        if (!tile || tile.tileId !== tileId) {
          // Rectangle is incomplete, reduce dimensions
          // Find the largest valid rectangle
          let validRepeatsX = 1;
          let validRepeatsY = 1;

          // Check row by row
          outerLoop: for (let row = 0; row < repeatsY; row++) {
            for (let col = 0; col < repeatsX; col++) {
              const testKey = `${x + col},${y + row}`;
              const testTile = tileMap.get(testKey);
              if (!testTile || testTile.tileId !== tileId) {
                validRepeatsY = row;
                validRepeatsX = col;
                break outerLoop;
              }
            }
          }

          // If we found at least one valid row, check how wide it is
          if (validRepeatsY === 0) {
            // First row is incomplete, find width
            validRepeatsX = 1;
            while (validRepeatsX < repeatsX) {
              const testKey = `${x + validRepeatsX},${y}`;
              const testTile = tileMap.get(testKey);
              if (!testTile || testTile.tileId !== tileId) break;
              validRepeatsX++;
            }
            validRepeatsY = 1;
          } else {
            // Complete rows found, verify width
            validRepeatsX = repeatsX;
            for (let row = 0; row < validRepeatsY; row++) {
              let rowWidth = 0;
              while (rowWidth < validRepeatsX) {
                const testKey = `${x + rowWidth},${y + row}`;
                const testTile = tileMap.get(testKey);
                if (!testTile || testTile.tileId !== tileId) break;
                rowWidth++;
              }
              validRepeatsX = Math.min(validRepeatsX, rowWidth);
            }
          }

          return { repeatsX: validRepeatsX, repeatsY: validRepeatsY };
        }
      }
    }

    return { repeatsX, repeatsY };
  };

  const handleExport = async () => {
    const filePath = await save({
      filters: [
        {
          name: "Map File",
          extensions: ["map"],
        },
      ],
      defaultPath: "map.map",
    });

    if (filePath) {
      // Create a map for quick lookup
      const tileMap = new Map<string, PlacedTile>();
      placedTiles.forEach((pt) => {
        tileMap.set(`${pt.x},${pt.y}`, pt);
      });

      // Sort tiles by position (top-to-bottom, left-to-right)
      const sortedTiles = [...placedTiles].sort((a, b) => {
        if (a.y !== b.y) return a.y - b.y;
        return a.x - b.x;
      });

      const exportedPositions = new Set<string>();
      const lines: string[] = [];

      for (const tile of sortedTiles) {
        const key = `${tile.x},${tile.y}`;

        // Skip if already exported as part of a rectangle
        if (exportedPositions.has(key)) continue;

        // Detect rectangular repetition
        const { repeatsX, repeatsY } = detectRectangularRepetition(
          tile,
          tileMap
        );

        // Mark all positions in the rectangle as exported
        for (let dy = 0; dy < repeatsY; dy++) {
          for (let dx = 0; dx < repeatsX; dx++) {
            exportedPositions.add(`${tile.x + dx},${tile.y + dy}`);
          }
        }

        // Export the tile with repetition counts
        lines.push(`${tile.tileId} ${tile.x} ${tile.y} ${repeatsX} ${repeatsY}`);
      }

      try {
        await invoke("export_map", {
          path: filePath,
          content: lines.join("\n"),
        });
        alert("Map exported successfully!");
      } catch (error) {
        alert("Failed to export map: " + error);
      }
    }
  };

  return (
    <div className="app">
      <Toolbar
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
        onExport={handleExport}
        onImportImages={handleImportImages}
        backgroundColor={backgroundColor}
        onBackgroundColorChange={setBackgroundColor}
        showGridlines={showGridlines}
        onToggleGridlines={() => setShowGridlines(!showGridlines)}
      />
      <div className="main-content">
        <div style={{ flex: 1, minWidth: 0, display: "flex" }}>
          <GridCanvas
            gridSize={gridSize}
            tiles={tiles}
            placedTiles={placedTiles}
            selectedTileId={selectedTileId}
            onPlaceTile={handlePlaceTile}
            onDeleteTile={handleDeleteTile}
            backgroundColor={backgroundColor}
            showGridlines={showGridlines}
          />
        </div>
        <TilePalette
          tiles={tiles}
          selectedTileId={selectedTileId}
          onSelectTile={setSelectedTileId}
          onEditTileId={handleEditTileId}
          onEditTileAlignment={handleEditTileAlignment}
          onToggleBlackTransparent={handleToggleBlackTransparent}
        />
      </div>
    </div>
  );
}

export default App;

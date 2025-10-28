import { useEffect, useRef, useState } from "react";
import { PlacedTile, Tile } from "../types";

interface GridCanvasProps {
  gridSize: number;
  tiles: Tile[];
  placedTiles: PlacedTile[];
  selectedTileId: string | null;
  onPlaceTile: (x: number, y: number) => void;
  onDeleteTile: (x: number, y: number) => void;
  backgroundColor: string;
  showGridlines: boolean;
}

export function GridCanvas({
  gridSize,
  tiles,
  placedTiles,
  selectedTileId,
  onPlaceTile,
  onDeleteTile,
  backgroundColor,
  showGridlines,
}: GridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [zoom, setZoom] = useState(1.0);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hoveredGridPos, setHoveredGridPos] = useState<{ x: number; y: number } | null>(null);

  // Handle canvas resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setCanvasSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Load images
  useEffect(() => {
    const imageMap = new Map<string, HTMLImageElement>();

    // Helper function to make black pixels transparent
    const makeBlackTransparent = (sourceImg: HTMLImageElement): HTMLImageElement => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = sourceImg.width;
        canvas.height = sourceImg.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return sourceImg;
        }

        ctx.drawImage(sourceImg, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Make black pixels transparent
        // We check for near-black pixels (RGB values close to 0)
        const threshold = 10; // Adjust this to catch near-black pixels
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // If pixel is black or near-black, make it transparent
          if (r <= threshold && g <= threshold && b <= threshold) {
            data[i + 3] = 0; // Set alpha to 0 (transparent)
          }
        }

        ctx.putImageData(imageData, 0, 0);

        // Create new image from processed canvas
        const processedImg = new Image();
        processedImg.src = canvas.toDataURL('image/png');
        return processedImg;
      } catch (error) {
        console.error('Error processing image transparency:', error);
        return sourceImg;
      }
    };

    tiles.forEach((tile) => {
      const img = new Image();
      img.src = tile.imageData;

      img.onload = () => {
        // Only apply black transparency if the tile has it enabled
        const processedImg = tile.blackTransparent ? makeBlackTransparent(img) : img;
        imageMap.set(tile.id, processedImg);
        // Trigger re-render when image is processed
        setLoadedImages(new Map(imageMap));
      };
    });

    setLoadedImages(imageMap);
  }, [tiles]);

  // Draw grid and tiles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Disable image smoothing for pixelated rendering
    ctx.imageSmoothingEnabled = false;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scaledGridSize = gridSize * zoom;

    // Draw grid (only if showGridlines is true)
    if (showGridlines) {
      ctx.strokeStyle = "#444";
      ctx.lineWidth = 1;

      const startX = Math.floor(-offset.x / scaledGridSize) * scaledGridSize + offset.x;
      const startY = Math.floor(-offset.y / scaledGridSize) * scaledGridSize + offset.y;

      // Vertical lines
      for (let x = startX; x < canvas.width; x += scaledGridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = startY; y < canvas.height; y += scaledGridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw axis lines at 0,0
      ctx.strokeStyle = "#ff4444";
      ctx.lineWidth = 3;

      // Vertical axis at x=0
      const axisX = offset.x;
      if (axisX >= 0 && axisX <= canvas.width) {
        ctx.beginPath();
        ctx.moveTo(axisX, 0);
        ctx.lineTo(axisX, canvas.height);
        ctx.stroke();
      }

      // Horizontal axis at y=0
      const axisY = offset.y;
      if (axisY >= 0 && axisY <= canvas.height) {
        ctx.beginPath();
        ctx.moveTo(0, axisY);
        ctx.lineTo(canvas.width, axisY);
        ctx.stroke();
      }
    }

    // Draw placed tiles
    placedTiles.forEach((placedTile) => {
      const img = loadedImages.get(placedTile.tileId);
      const tile = tiles.find((t) => t.id === placedTile.tileId);

      if (img && img.complete && tile) {
        const baseX = placedTile.x * scaledGridSize + offset.x;
        const baseY = placedTile.y * scaledGridSize + offset.y;

        // Calculate alignment offsets
        const horizontalAlign = tile.horizontalAlign || "left";
        const verticalAlign = tile.verticalAlign || "top";

        const scaledImgWidth = img.width * zoom;
        const scaledImgHeight = img.height * zoom;

        let offsetX = 0;
        let offsetY = 0;

        // Horizontal alignment
        if (horizontalAlign === "center") {
          offsetX = (scaledGridSize - scaledImgWidth) / 2;
        } else if (horizontalAlign === "right") {
          offsetX = scaledGridSize - scaledImgWidth;
        }

        // Vertical alignment
        if (verticalAlign === "middle") {
          offsetY = (scaledGridSize - scaledImgHeight) / 2;
        } else if (verticalAlign === "bottom") {
          offsetY = scaledGridSize - scaledImgHeight;
        }

        const screenX = baseX + offsetX;
        const screenY = baseY + offsetY;

        // Draw image at scaled size
        ctx.drawImage(img, screenX, screenY, scaledImgWidth, scaledImgHeight);
      }
    });

    // Draw hover preview
    if (hoveredGridPos && selectedTileId && !isPlacing && !isDeleting && !isDragging) {
      const selectedImg = loadedImages.get(selectedTileId);
      const selectedTile = tiles.find((t) => t.id === selectedTileId);

      if (selectedImg && selectedImg.complete && selectedTile) {
        const baseX = hoveredGridPos.x * scaledGridSize + offset.x;
        const baseY = hoveredGridPos.y * scaledGridSize + offset.y;

        // Calculate alignment offsets
        const horizontalAlign = selectedTile.horizontalAlign || "left";
        const verticalAlign = selectedTile.verticalAlign || "top";

        const scaledImgWidth = selectedImg.width * zoom;
        const scaledImgHeight = selectedImg.height * zoom;

        let offsetX = 0;
        let offsetY = 0;

        // Horizontal alignment
        if (horizontalAlign === "center") {
          offsetX = (scaledGridSize - scaledImgWidth) / 2;
        } else if (horizontalAlign === "right") {
          offsetX = scaledGridSize - scaledImgWidth;
        }

        // Vertical alignment
        if (verticalAlign === "middle") {
          offsetY = (scaledGridSize - scaledImgHeight) / 2;
        } else if (verticalAlign === "bottom") {
          offsetY = scaledGridSize - scaledImgHeight;
        }

        const screenX = baseX + offsetX;
        const screenY = baseY + offsetY;

        // Draw translucent preview
        ctx.globalAlpha = 0.5;
        ctx.drawImage(selectedImg, screenX, screenY, scaledImgWidth, scaledImgHeight);
        ctx.globalAlpha = 1.0;
      }
    }
  }, [gridSize, placedTiles, offset, loadedImages, canvasSize, tiles, zoom, backgroundColor, showGridlines, hoveredGridPos, selectedTileId, isPlacing, isDeleting, isDragging]);

  const screenToGrid = (screenX: number, screenY: number) => {
    const scaledGridSize = gridSize * zoom;
    return {
      x: Math.floor((screenX - offset.x) / scaledGridSize),
      y: Math.floor((screenY - offset.y) / scaledGridSize),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 0 && e.shiftKey) {
      // Middle mouse or Shift+Left mouse for panning
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    } else if (e.button === 0) {
      // Left click - place tile
      const gridPos = screenToGrid(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      if (selectedTileId) {
        onPlaceTile(gridPos.x, gridPos.y);
        setIsPlacing(true);
      }
    } else if (e.button === 2) {
      // Right click - delete tile
      const gridPos = screenToGrid(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      onDeleteTile(gridPos.x, gridPos.y);
      setIsDeleting(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const gridPos = screenToGrid(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setHoveredGridPos(gridPos);

    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else if (isPlacing && selectedTileId) {
      // Continue placing tiles while dragging
      onPlaceTile(gridPos.x, gridPos.y);
    } else if (isDeleting) {
      // Continue deleting tiles while dragging
      onDeleteTile(gridPos.x, gridPos.y);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsPlacing(false);
    setIsDeleting(false);
  };

  const handleMouseLeaveCanvas = () => {
    setIsDragging(false);
    setIsPlacing(false);
    setIsDeleting(false);
    setHoveredGridPos(null);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    // Get mouse position relative to canvas
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate world position before zoom
    const worldX = (mouseX - offset.x) / zoom;
    const worldY = (mouseY - offset.y) / zoom;

    // Update zoom (zoom in on scroll up, out on scroll down)
    const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, zoom * zoomDelta));

    // Calculate new offset to keep mouse position at same world position
    const newOffsetX = mouseX - worldX * newZoom;
    const newOffsetY = mouseY - worldY * newZoom;

    setZoom(newZoom);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  // Get hovered tile info
  const hoveredTile = hoveredGridPos
    ? placedTiles.find((t) => t.x === hoveredGridPos.x && t.y === hoveredGridPos.y)
    : null;

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1a1a1a",
        padding: "10px",
        position: "relative",
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          border: "2px solid #555",
          cursor: isDragging ? "grabbing" : isPlacing || isDeleting ? "crosshair" : "crosshair",
          backgroundColor: backgroundColor,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeaveCanvas}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
      />
      {hoveredGridPos && (
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            left: "10px",
            padding: "8px 12px",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "#fff",
            borderRadius: "4px",
            fontSize: "13px",
            fontFamily: "monospace",
            pointerEvents: "none",
            border: "1px solid #555",
          }}
        >
          <div>
            Position: {hoveredGridPos.x}, {hoveredGridPos.y}
          </div>
          {hoveredTile && <div>Tile: {hoveredTile.tileId}</div>}
        </div>
      )}
    </div>
  );
}

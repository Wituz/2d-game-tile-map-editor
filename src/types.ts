export type HorizontalAlign = "left" | "center" | "right";
export type VerticalAlign = "top" | "middle" | "bottom";

export interface Tile {
  id: string; // e.g., "STONE", "TREE"
  imagePath: string;
  imageData: string; // base64 encoded image
  horizontalAlign?: HorizontalAlign; // defaults to "left"
  verticalAlign?: VerticalAlign; // defaults to "top"
  blackTransparent?: boolean; // whether black pixels should be transparent (defaults to false)
}

export interface PlacedTile {
  tileId: string;
  x: number;
  y: number;
}

export interface MapProject {
  gridSize: number; // size of each grid cell in pixels
  tiles: Tile[]; // all available tiles
  placedTiles: PlacedTile[]; // tiles placed on the map
  backgroundColor?: string; // background color of the map (defaults to #2a2a2a)
}

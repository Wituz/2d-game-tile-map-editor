import { Tile, HorizontalAlign, VerticalAlign } from "../types";
import "./TilePalette.css";

interface TilePaletteProps {
  tiles: Tile[];
  selectedTileId: string | null;
  onSelectTile: (tileId: string) => void;
  onEditTileId: (oldId: string, newId: string) => void;
  onEditTileAlignment: (tileId: string, horizontalAlign: HorizontalAlign, verticalAlign: VerticalAlign) => void;
  onToggleBlackTransparent: (tileId: string) => void;
}

export function TilePalette({
  tiles,
  selectedTileId,
  onSelectTile,
  onEditTileId,
  onEditTileAlignment,
  onToggleBlackTransparent,
}: TilePaletteProps) {
  return (
    <div className="tile-palette">
      <h3>Tile Palette</h3>
      {tiles.length === 0 && (
        <p className="empty-message">No tiles imported yet. Use Import Images to add tiles.</p>
      )}
      <div className="tile-list">
        {tiles.map((tile) => {
          const isSelected = selectedTileId === tile.id;
          return (
            <div
              key={tile.id}
              className={`tile-item ${isSelected ? "selected expanded" : "compact"}`}
              onClick={() => onSelectTile(tile.id)}
            >
              <img src={tile.imageData} alt={tile.id} className="tile-preview" />
              {isSelected && (
                <>
                  <input
                    type="text"
                    value={tile.id}
                    className="tile-id-input"
                    onChange={(e) => {
                      e.stopPropagation();
                      onEditTileId(tile.id, e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="alignment-controls" onClick={(e) => e.stopPropagation()}>
                    <div className="alignment-row">
                      <label>H:</label>
                      <select
                        value={tile.horizontalAlign || "left"}
                        onChange={(e) => {
                          e.stopPropagation();
                          onEditTileAlignment(
                            tile.id,
                            e.target.value as HorizontalAlign,
                            tile.verticalAlign || "top"
                          );
                        }}
                        className="alignment-select"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                    <div className="alignment-row">
                      <label>V:</label>
                      <select
                        value={tile.verticalAlign || "top"}
                        onChange={(e) => {
                          e.stopPropagation();
                          onEditTileAlignment(
                            tile.id,
                            tile.horizontalAlign || "left",
                            e.target.value as VerticalAlign
                          );
                        }}
                        className="alignment-select"
                      >
                        <option value="top">Top</option>
                        <option value="middle">Middle</option>
                        <option value="bottom">Bottom</option>
                      </select>
                    </div>
                    <div className="transparency-toggle">
                      <label>
                        <input
                          type="checkbox"
                          checked={tile.blackTransparent || false}
                          onChange={(e) => {
                            e.stopPropagation();
                            onToggleBlackTransparent(tile.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>Black Transparent</span>
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

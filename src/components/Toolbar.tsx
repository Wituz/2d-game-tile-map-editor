import "./Toolbar.css";

interface ToolbarProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onExport: () => void;
  onImportImages: () => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  showGridlines: boolean;
  onToggleGridlines: () => void;
}

export function Toolbar({
  onNew,
  onOpen,
  onSave,
  onExport,
  onImportImages,
  backgroundColor,
  onBackgroundColorChange,
  showGridlines,
  onToggleGridlines,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <button onClick={onNew} className="toolbar-button">
        New
      </button>
      <button onClick={onOpen} className="toolbar-button">
        Open
      </button>
      <button onClick={onSave} className="toolbar-button">
        Save
      </button>
      <button onClick={onExport} className="toolbar-button export">
        Export .map
      </button>
      <button onClick={onImportImages} className="toolbar-button import">
        Import Images
      </button>
      <div className="toolbar-color-picker">
        <label htmlFor="bg-color">Background:</label>
        <input
          id="bg-color"
          type="color"
          value={backgroundColor}
          onChange={(e) => onBackgroundColorChange(e.target.value)}
          className="color-input"
        />
      </div>
      <button
        onClick={onToggleGridlines}
        className="toolbar-button"
        style={{ marginLeft: '10px' }}
      >
        {showGridlines ? "Hide Grid" : "Show Grid"}
      </button>
    </div>
  );
}

import { memo } from "react";

function Legend({ ores, hidden, solo, onToggle, onSolo }) {
  if (!ores.length) return null;
  return (
    <div className="legend" role="group" aria-label="Ore legend">
      {ores.map((o) => {
        const off = !!hidden[o.id];
        const isSolo = solo === o.id;
        return (
          <button key={o.id}
            className={"leg-item " + (off ? "off " : "") + (isSolo ? "solo" : "")}
            onClick={() => onToggle(o.id)}
            onDoubleClick={() => onSolo(o.id)}
            aria-pressed={!off}
            title="Click to toggle · Double-click to solo">
            <span className="leg-sw" style={{ background: o.color }} />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default memo(Legend);

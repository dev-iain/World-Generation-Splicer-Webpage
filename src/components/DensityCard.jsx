import { useRef } from "react";
import DensityLine from "../charts/DensityLine";
import Legend from "../charts/Legend";
import { DownloadIcon } from "./Icons";
import { exportSvgPng, exportCsv } from "../lib/exports";

export default function DensityCard({ ores, hidden, solo, doSolo, toggleHide, mode, setMode, dim, dimId }) {
  const cardRef = useRef(null);

  const onCsv = () => {
    const field = mode === "normalized" ? "normalized" : "percentages";
    const rows = [["y_level", ...ores.map(o => o.id)]];
    for (let y = dim.minY; y <= dim.maxY; y++) {
      rows.push([y, ...ores.map(o => {
        const idx = y - o.minY;
        return (idx >= 0 && idx < o[field].length) ? o[field][idx].toFixed(4) : "";
      })]);
    }
    exportCsv(rows, `${dimId}_density_${mode}.csv`);
  };

  const onPng = () => exportSvgPng(cardRef.current.querySelector("svg.card-svg"), `${dimId}_density.png`);

  return (
    <article className="card" ref={cardRef}>
      <header className="card-head">
        <div>
          <div className="card-title">Ore Density Graph</div>
          <div className="card-sub">One curve per ore — X is Y Level, Y is density. Scroll to zoom, drag to pan, double-click to reset. Solo one ore to see values.</div>
        </div>
        <div className="card-actions">
          <div className="mode-toggle" role="tablist" aria-label="Density mode">
            <button role="tab" aria-selected={mode === "percentage"} className={mode === "percentage" ? "on" : ""} onClick={() => setMode("percentage")}>Percentage</button>
            <button role="tab" aria-selected={mode === "normalized"} className={mode === "normalized" ? "on" : ""} onClick={() => setMode("normalized")}>Normalized</button>
          </div>
          <button className="mini-btn" onClick={onPng}><DownloadIcon /> PNG</button>
          <button className="mini-btn" onClick={onCsv}><DownloadIcon /> CSV</button>
        </div>
      </header>
      <div className="card-body">
        <DensityLine ores={ores} hidden={hidden} solo={solo} onClick={doSolo} mode={mode} dim={dim} />
      </div>
      <Legend ores={ores} hidden={hidden} solo={solo} onToggle={toggleHide} onSolo={doSolo} />
    </article>
  );
}

import { useRef } from "react";
import SpawnRangeBar from "../charts/SpawnRangeBar";
import Legend from "../charts/Legend";
import { DownloadIcon } from "./Icons";
import { exportSvgPng, exportCsv } from "../lib/exports";

export default function RangeCard({ ores, hidden, solo, doSolo, toggleHide, dim, dimId }) {
  const cardRef = useRef(null);

  const onCsv = () => {
    const rows = [["id", "label", "min_y", "max_y", "ranges", "per_chunk", "total_count"]];
    for (const o of ores) {
      const segs = (o.ranges || []).map(r => r.minY === r.maxY ? `${r.minY}` : `${r.minY}..${r.maxY}`).join(";");
      rows.push([
        o.id,
        o.label,
        o.minY,
        o.maxY,
        segs,
        typeof o.perChunk === "number" ? o.perChunk.toFixed(4) : "",
        typeof o.totalCount === "number" ? o.totalCount : "",
      ]);
    }
    exportCsv(rows, `${dimId}_range.csv`);
  };

  const onPng = () => exportSvgPng(cardRef.current.querySelector("svg.card-svg"), `${dimId}_range.png`);

  return (
    <article className="card" ref={cardRef}>
      <header className="card-head">
        <div>
          <div className="card-title">Ore Spawn Range Graph</div>
          <div className="card-sub">One bar per ore showing min and max Y. Disjoint outlier ranges render as dots. Scroll wheel zooms Y-axis. Drag left/right to scroll columns. Double-click to reset.</div>
        </div>
        <div className="card-actions">
          <button className="mini-btn" onClick={onPng}><DownloadIcon /> PNG</button>
          <button className="mini-btn" onClick={onCsv}><DownloadIcon /> CSV</button>
        </div>
      </header>
      <div className="card-body">
        <SpawnRangeBar ores={ores} hidden={hidden} solo={solo} onClick={doSolo} dim={dim} />
      </div>
      <Legend ores={ores} hidden={hidden} solo={solo} onToggle={toggleHide} onSolo={doSolo} />
    </article>
  );
}

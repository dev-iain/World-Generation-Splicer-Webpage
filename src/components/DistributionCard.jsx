import { useRef } from "react";
import DistributionViolin from "../charts/DistributionViolin";
import Legend from "../charts/Legend";
import { DownloadIcon } from "./Icons";
import { exportSvgPng, exportCsv } from "../lib/exports";

export default function DistributionCard({ ores, hidden, solo, doSolo, toggleHide, dim, dimId }) {
  const cardRef = useRef(null);

  const onCsv = () => {
    const rows = [["y_level", ...ores.map(o => o.id)]];
    for (let y = dim.minY; y <= dim.maxY; y++) {
      rows.push([y, ...ores.map(o => {
        const idx = y - o.minY;
        return (idx >= 0 && idx < o.counts.length) ? o.counts[idx].toFixed(2) : "";
      })]);
    }
    exportCsv(rows, `${dimId}_distribution.csv`);
  };

  const onPng = () => exportSvgPng(cardRef.current.querySelector("svg.card-svg"), `${dimId}_distribution.png`);

  return (
    <article className="card" ref={cardRef}>
      <header className="card-head">
        <div>
          <div className="card-title">Ore Distribution Graph</div>
          <div className="card-sub">One column per ore. Bulge width = normalized spawn rate at each Y level. Scroll wheel zooms Y-axis. Drag left/right to scroll columns. Double-click to reset.</div>
        </div>
        <div className="card-actions">
          <button className="mini-btn" onClick={onPng}><DownloadIcon /> PNG</button>
          <button className="mini-btn" onClick={onCsv}><DownloadIcon /> CSV</button>
        </div>
      </header>
      <div className="card-body">
        <DistributionViolin ores={ores} hidden={hidden} solo={solo} onClick={doSolo} dim={dim} />
      </div>
      <Legend ores={ores} hidden={hidden} solo={solo} onToggle={toggleHide} onSolo={doSolo} />
    </article>
  );
}

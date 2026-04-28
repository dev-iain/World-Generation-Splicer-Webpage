import { useRef } from "react";
import ScoreLine from "../charts/ScoreLine";
import OrePie from "../charts/OrePie";
import OrePicker from "./OrePicker";
import { DownloadIcon } from "./Icons";
import { exportSvgPng, exportCsv } from "../lib/exports";

function fmtTopRow(score) {
  return score.toFixed(score < 0.01 ? 4 : score < 1 ? 3 : score < 10 ? 2 : 1);
}

export default function OptimizerCard({
  ores, oresById, dim, dimId,
  selected, setSelected,
  scoreMode, setScoreMode,
  showDeriv, setShowDeriv,
  pieY, setPieY,
  oreSearch, setOreSearch,
  scoreSeries, pieData, activePieY,
  bestY, bucketSize,
}) {
  const cardRef = useRef(null);

  const onCsv = () => {
    const ids = Object.keys(selected);
    const headers = ["y_level", "score", "dscore", ...ids.map(id => `${id}:contrib`)];
    const rows = [headers];
    const chunks = Math.max(1, dim.chunksScanned || 1);
    const blocksAtY = chunks * 256 * (bucketSize || 1);
    const denom = scoreMode === "percentage" ? blocksAtY : chunks;
    for (let y = dim.minY; y <= dim.maxY; y++) {
      const i = y - dim.minY;
      const row = [y, scoreSeries.score[i].toFixed(6), scoreSeries.dscore[i].toFixed(6)];
      for (const oreId of ids) {
        const o = oresById[oreId];
        if (!o) { row.push(""); continue; }
        const idx = y - o.minY;
        const arr = o.counts || [];
        const w = +selected[oreId] || 0;
        const v = (idx >= 0 && idx < arr.length) ? ((arr[idx] || 0) * w) / denom : 0;
        row.push(v.toFixed(6));
      }
      rows.push(row);
    }
    exportCsv(rows, `${dimId}_optimize_${scoreMode}.csv`);
  };

  const onPng = () => exportSvgPng(cardRef.current && cardRef.current.querySelector("svg.card-svg"), `${dimId}_optimize.png`);

  return (
    <article className="card opt-card" ref={cardRef}>
      <header className="card-head">
        <div>
          <div className="card-title">Y-Level Optimizer</div>
          <div className="card-sub">
            Pick ores, set weights — score(Y) = Σ(weight × density). Best Y is the argmax. Pie shows actual block proportions at the selected Y (unweighted).
            {bucketSize > 1 && ` Aggregated to ${bucketSize}-block Y buckets.`}
          </div>
        </div>
        <div className="card-actions">
          <span className="opt-best-badge">Best Y = {bestY != null ? bestY : "—"}</span>
          <div className="mode-toggle" role="tablist" aria-label="Score mode">
            <button role="tab" aria-selected={scoreMode === "percentage"} className={scoreMode === "percentage" ? "on" : ""} onClick={() => setScoreMode("percentage")}>Percentage</button>
            <button role="tab" aria-selected={scoreMode === "count"} className={scoreMode === "count" ? "on" : ""} onClick={() => setScoreMode("count")}>Count / chunk</button>
          </div>
          <button className={"mini-btn " + (showDeriv ? "on" : "")} onClick={() => setShowDeriv(d => !d)} title="Toggle d/dY overlay">d/dY</button>
          <button className="mini-btn" onClick={onPng}><DownloadIcon /> PNG</button>
          <button className="mini-btn" onClick={onCsv}><DownloadIcon /> CSV</button>
        </div>
      </header>
      <div className="card-body opt-body">
        <OrePicker
          ores={ores}
          selected={selected}
          search={oreSearch}
          setSearch={setOreSearch}
          onAdd={(id) => setSelected(s => ({ ...s, [id]: 1 }))}
          onRemove={(id) => setSelected(s => { const n = { ...s }; delete n[id]; return n; })}
          onWeight={(id, v) => setSelected(s => ({ ...s, [id]: v === "" ? 0 : Math.max(0, Math.min(10, +v || 0)) }))}
          onClear={() => setSelected({})}
          onSelectAll={(list) => setSelected(s => {
            const n = { ...s };
            for (const o of list) if (!(o.id in n)) n[o.id] = 1;
            return n;
          })}
        />
        <div className="opt-grid">
          <div className="opt-score">
            <ScoreLine
              dim={dim}
              scoreSeries={scoreSeries}
              scoreMode={scoreMode}
              showDeriv={showDeriv}
              pieY={pieY}
              onPickY={setPieY}
            />
          </div>
          <div className="opt-pie">
            <OrePie pieData={pieData} y={activePieY} />
          </div>
        </div>
        {scoreSeries.topK.length > 0 && (
          <div className="opt-summary">
            <div className="opt-summary-head">Top Y levels</div>
            <ol>
              {scoreSeries.topK.map((t, i) => {
                const peak = scoreSeries.topK[0].score || 1;
                const pct = t.score / peak;
                const isOn = (pieY != null && pieY === t.y) || (pieY == null && i === 0);
                const fmt = scoreMode === "percentage"
                  ? (t.score * 100).toFixed(2) + "%"
                  : fmtTopRow(t.score);
                return (
                  <li key={t.y} className={isOn ? "on" : ""}>
                    <button className="opt-summary-row" onClick={() => setPieY(t.y)}>
                      <span className="opt-summary-rank">#{i + 1}</span>
                      <span className="opt-summary-y">Y = {t.y}</span>
                      <span className="opt-summary-bar"><span style={{ width: (pct * 100).toFixed(1) + "%" }}/></span>
                      <span className="opt-summary-val">{fmt}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </article>
  );
}

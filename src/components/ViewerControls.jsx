const GRAPH_TABS = [
  { key: "density", label: "Density" },
  { key: "distribution", label: "Distribution" },
  { key: "range", label: "Spawn Range" },
  { key: "optimize", label: "Optimize" },
];

export default function ViewerControls({
  data, dimIds, dimId, setDimId,
  graphStyle, setGraphStyle,
  merged, setMerged,
  dim, oresLength,
}) {
  return (
    <section className="ctrl-bar" aria-label="Controls">
      <div style={{ display: "inline-flex", gap: 10, flexWrap: "wrap" }}>
        <label className="dim-select" aria-label="Dimension">
          <span className="dim-select-label">Dimension</span>
          <select value={dimId} onChange={(e) => setDimId(e.target.value)}>
            {dimIds.map((id) => (
              <option key={id} value={id}>{data.dimensions[id].label}</option>
            ))}
          </select>
        </label>
        <div className="seg" role="tablist" aria-label="Graph style">
          {GRAPH_TABS.map(({ key, label }) => (
            <button key={key}
              role="tab"
              aria-selected={graphStyle === key}
              className={graphStyle === key ? "on" : ""}
              onClick={() => setGraphStyle(key)}>
              {label}
            </button>
          ))}
        </div>
        <div className="seg" aria-label="Merge variants">
          <button aria-pressed={merged}
            className={merged ? "on" : ""}
            onClick={() => setMerged(m => !m)}
            title="Combine all variants of the same ore type (e.g. Gold + Deepslate Gold + Nether Gold)">
            Merge variants
          </button>
        </div>
      </div>
      <div className="dim-meta">
        {dim.id} · y range: {dim.minY} → {dim.maxY} · {oresLength} ore{oresLength === 1 ? "" : "s"}
      </div>
    </section>
  );
}

import { trimNs } from "../lib/chart-math";

export default function OrePicker({ ores, selected, search, setSearch, onAdd, onRemove, onWeight, onClear, onSelectAll }) {
  const selectedIds = Object.keys(selected);
  const q = search.trim().toLowerCase();
  const available = ores.filter(o => !(o.id in selected))
    .filter(o => !q || o.label.toLowerCase().includes(q) || o.id.toLowerCase().includes(q));
  const tooMany = selectedIds.length > 12;
  return (
    <div className="opt-picker-wrap">
      <div className="opt-picker-head">
        <input className="ore-search" type="text" value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${ores.length} ores by name or id...`} />
        <button className="mini-btn" onClick={() => onSelectAll(available)} disabled={!available.length}>
          Add visible
        </button>
        <button className="mini-btn" onClick={onClear} disabled={!selectedIds.length}>Clear</button>
      </div>
      <div className="opt-picker">
        <div className="opt-pick-col">
          <div className="opt-pick-label">Available · {available.length}</div>
          <div className="opt-pick-pane">
            {available.length ? available.map(o => (
              <button key={o.id} className="opt-pick-row" onClick={() => onAdd(o.id)} aria-label={`Add ${o.label}`}>
                <span className="leg-sw" style={{ background: o.color }}/>
                <span className="opt-pick-name">{o.label}</span>
                <span className="opt-pick-id" title={o.id}>{trimNs(o.id)}</span>
                <span className="opt-pick-add" aria-hidden="true">+</span>
              </button>
            )) : <div className="opt-pick-empty">{q ? "No matches" : "All ores selected"}</div>}
          </div>
        </div>
        <div className="opt-pick-col">
          <div className="opt-pick-label">Selected · {selectedIds.length}</div>
          <div className="opt-pick-pane">
            {selectedIds.length ? selectedIds.map(id => {
              const o = ores.find(x => x.id === id);
              if (!o) return null;
              return (
                <div key={id} className="opt-pick-row sel">
                  <span className="leg-sw" style={{ background: o.color }}/>
                  <span className="opt-pick-name">{o.label}</span>
                  <input className="opt-weight" type="number" min="0" max="10" step="0.1"
                    value={selected[id]}
                    onChange={(e) => onWeight(id, e.target.value)}
                    title="Weight: multiplier on density when computing best Y" />
                  <button className="opt-remove" onClick={() => onRemove(id)} title="Remove">×</button>
                </div>
              );
            }) : <div className="opt-pick-empty">No ores selected · pick from the left</div>}
          </div>
        </div>
      </div>
      {tooMany && <div className="opt-warning">{selectedIds.length} ores selected — pie may become hard to read past 12.</div>}
    </div>
  );
}

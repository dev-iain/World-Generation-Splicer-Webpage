import { memo, useRef } from "react";
import { showTip, hideTip } from "../lib/tooltip";
import { escapeHtml, safeColor } from "../lib/colors";

const CX = 180, CY = 160, R = 130;

function fmtPct(f) {
  return (f * 100).toFixed(f < 0.001 ? 3 : (f < 0.01 ? 2 : 1)) + "%";
}

function sliceTooltip(s, ref, tipRef) {
  return (e) => {
    const html = `<div class="t-head"><span class="t-sw" style="background:${safeColor(s.color)}"></span><span class="t-lbl">${escapeHtml(s.label)}</span></div>` +
      `<div class="t-y" style="margin-top:2px">count: <b style="color:var(--ink)">${escapeHtml(s.count.toLocaleString())}</b></div>` +
      `<div class="t-y">share: <b style="color:var(--ink)">${escapeHtml(fmtPct(s.frac))}</b></div>`;
    const aria = `${s.label}, ${s.count.toLocaleString()} blocks, ${fmtPct(s.frac)} share`;
    showTip(tipRef, e, ref.current, html, aria);
  };
}

function arcPath(s) {
  const x1 = CX + R * Math.cos(s.start), y1 = CY + R * Math.sin(s.start);
  const x2 = CX + R * Math.cos(s.end),   y2 = CY + R * Math.sin(s.end);
  const largeArc = (s.end - s.start) > Math.PI ? 1 : 0;
  return s.frac >= 0.9999
    ? `M ${CX-R} ${CY} A ${R} ${R} 0 1 1 ${CX+R} ${CY} A ${R} ${R} 0 1 1 ${CX-R} ${CY} Z`
    : `M ${CX} ${CY} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

function OrePie({ pieData, y }) {
  const ref = useRef(null);
  const tipRef = useRef(null);
  const slices = pieData.slices;
  return (
    <div ref={ref} className="opt-pie-wrap" style={{ position: "relative" }}>
      <svg className="card-svg" width="360" height="320" viewBox="0 0 360 320" role="img" aria-label="Block proportion pie at selected Y level">
        <rect x="0" y="0" width="360" height="320" fill="var(--panel)"/>
        {slices.length === 0 && (
          <text x={CX} y={CY} textAnchor="middle" fontSize="12" fill="var(--muted)" fontFamily="JetBrains Mono, monospace">
            Select ores to see pie
          </text>
        )}
        {slices.map((s) => s.frac > 0 && (
          <path key={s.id} d={arcPath(s)} fill={s.color} stroke="var(--surface)" strokeWidth="1.2"
            onMouseMove={sliceTooltip(s, ref, tipRef)}
            onMouseLeave={() => hideTip(tipRef)} />
        ))}
        {slices.length > 0 && (
          <>
            <circle cx={CX} cy={CY} r={R * 0.42} fill="var(--panel)" stroke="var(--grid)" strokeWidth="1"/>
            <text x={CX} y={CY - 4} textAnchor="middle" fontSize="13" fontFamily="JetBrains Mono, monospace" fontWeight="700" fill="var(--ink)">
              Y = {y}
            </text>
            <text x={CX} y={CY + 14} textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono, monospace" fill="var(--muted)">
              {pieData.knownTotal ? `${pieData.blocksAtY.toLocaleString()} blocks` : "ratio only"}
            </text>
          </>
        )}
      </svg>
      <div className="pie-legend">
        {slices.map(s => (
          <div key={s.id} className="pie-leg-row">
            <span className="leg-sw" style={{ background: s.color }}/>
            <span className="pie-leg-name">{s.label}</span>
            <span className="pie-leg-num">{fmtPct(s.frac)}</span>
          </div>
        ))}
      </div>
      <div ref={tipRef} className="tip" role="status" aria-live="polite" aria-atomic="true"/>
    </div>
  );
}

export default memo(OrePie);

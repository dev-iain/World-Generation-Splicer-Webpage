import { memo, useEffect, useMemo, useRef, useState } from "react";
import { niceStep, useViewport, clampView, safeId } from "../lib/chart-math";
import { escapeHtml, safeColor, hexToRgba } from "../lib/colors";
import { showTip, hideTip } from "../lib/tooltip";
import { spawnRangeText } from "../lib/ores";

function DistributionViolin({ ores, hidden, solo, onClick, dim }) {
  const ref = useRef(null);
  const tipRef = useRef(null);
  const dragRef = useRef(null);
  const movedRef = useRef(false);
  const [, setDragging] = useState(false);
  const [w, setW] = useState(560);

  useEffect(() => {
    const on = () => ref.current && setW(ref.current.clientWidth);
    on(); window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  const { dataYMin, dataYMax } = useMemo(() => {
    let obsMin = Infinity, obsMax = -Infinity;
    for (const o of ores) {
      for (const r of (o.ranges || [])) {
        if (r.minY < obsMin) obsMin = r.minY;
        if (r.maxY > obsMax) obsMax = r.maxY;
      }
    }
    return {
      dataYMin: obsMin === Infinity ? dim.minY : obsMin,
      dataYMax: obsMax === -Infinity ? dim.maxY : obsMax,
    };
  }, [ores, dim.minY, dim.maxY]);

  const [view, setView] = useViewport(dataYMin, dataYMax, dim.id);
  const [yMin, yMax] = view;

  const visible = useMemo(() => ores.filter(o => !hidden[o.id]), [ores, hidden]);
  const singleOre = visible.length === 1 ? visible[0] : null;
  const longestLabelChars = visible.reduce((m, o) => Math.max(m, (o.label || "").length), 0);
  const labelDrop = Math.ceil(Math.sin(48 * Math.PI / 180) * longestLabelChars * 6.5) + 26;
  const pad = { top: 22, right: 20, bottom: Math.max(118, labelDrop), left: 58 };
  const minColW = 56;
  const plotW = Math.max(visible.length * minColW, w - pad.left - pad.right);
  const contentW = plotW + pad.left + pad.right;
  const plotH = 580;
  const h = pad.top + plotH + pad.bottom;

  const colW = plotW / Math.max(1, visible.length);

  const yPx = (y) => pad.top + (1 - (y - yMin) / Math.max(1, yMax - yMin)) * plotH;

  const yStep = niceStep(yMax - yMin);
  const yTicks = [];
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) yTicks.push(y);

  function bulgePath(o, range, x0) {
    const half = colW * 0.42;
    const vals = o.normalized;
    const yLo = Math.max(range.minY, Math.floor(yMin) - 1);
    const yHi = Math.min(range.maxY, Math.ceil(yMax) + 1);
    const points = [];
    for (let y = yLo; y <= yHi; y++) {
      const idx = y - o.minY;
      if (idx < 0 || idx >= vals.length) continue;
      const nv = vals[idx] || 0;
      points.push({ y, nv });
    }
    if (points.length < 2) return null;
    let d = "";
    const rightPts = points.map(p => [x0 + p.nv * half, yPx(p.y)]);
    const leftPts  = [...points].reverse().map(p => [x0, yPx(p.y)]);
    d += "M " + rightPts[0][0].toFixed(1) + " " + rightPts[0][1].toFixed(1);
    for (let i = 1; i < rightPts.length; i++) d += " L " + rightPts[i][0].toFixed(1) + " " + rightPts[i][1].toFixed(1);
    for (const p of leftPts) d += " L " + p[0].toFixed(1) + " " + p[1].toFixed(1);
    d += " Z";
    return d;
  }

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e) => {
      const rect = el.getBoundingClientRect();
      const relY = (e.clientY - rect.top - pad.top) / plotH;
      if (relY < 0 || relY > 1) return;
      e.preventDefault();
      const focal = yMax - relY * (yMax - yMin);
      const factor = e.deltaY > 0 ? 1.18 : 1 / 1.18;
      const newSpan = (yMax - yMin) * factor;
      const newMin = focal - (focal - yMin) * factor;
      const newMax = newMin + newSpan;
      setView(clampView(newMin, newMax, dataYMin, dataYMax, 4));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [yMin, yMax, dataYMin, dataYMax, plotH, pad.top, setView]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onDown = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (!e.target.closest("svg")) return;
      const rect = el.getBoundingClientRect();
      if (e.clientY >= rect.bottom - 18) return;
      dragRef.current = { pointerId: e.pointerId, x0: e.clientX, scroll0: el.scrollLeft };
      movedRef.current = false;
      setDragging(true);
      hideTip(tipRef);
      el.setPointerCapture(e.pointerId);
      e.preventDefault();
    };
    const onMove = (e) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.x0;
      if (Math.abs(dx) > 3) movedRef.current = true;
      el.scrollLeft = dragRef.current.scroll0 + dx;
    };
    const onUp = () => {
      if (dragRef.current && el.hasPointerCapture(dragRef.current.pointerId)) {
        el.releasePointerCapture(dragRef.current.pointerId);
      }
      dragRef.current = null;
      setDragging(false);
      if (movedRef.current) window.setTimeout(() => { movedRef.current = false; }, 0);
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const onDblClick = () => { setView([dataYMin, dataYMax]); if (ref.current) ref.current.scrollLeft = 0; };

  return (
    <div ref={ref} className="scrollx graph-pan" style={{ width: "100%", position: "relative" }}>
      <svg className="card-svg" width={contentW} height={h} role="img" aria-label="Ore distribution ridgeline by ore column"
        style={{ width: contentW, minWidth: contentW, maxWidth: "none", cursor: "ew-resize" }}
        onDoubleClick={onDblClick}>
        <rect x="0" y="0" width={contentW} height={h} fill="var(--panel)"/>
        {yTicks.map((y, i) => {
          const py = yPx(y);
          return (
            <g key={`y${i}`}>
              <line x1={pad.left} x2={pad.left + plotW} y1={py} y2={py} stroke="var(--grid)"/>
              <text x={pad.left - 8} y={py + 4} textAnchor="end" fontSize="11" fontFamily="Inter, sans-serif" fill="var(--axis)">{y}</text>
            </g>
          );
        })}

        <defs>
          <clipPath id={`vclip-${safeId(dim.id)}`}>
            <rect x={pad.left} y={pad.top} width={plotW} height={plotH}/>
          </clipPath>
        </defs>
        <g clipPath={`url(#vclip-${safeId(dim.id)})`}>
          {visible.map((o, i) => {
            const x0 = pad.left + i * colW + 4;
            const dimOp = solo && solo !== o.id ? 0.18 : 1;
            const fillCol = hexToRgba(o.color, 190/255);
            return (
              <g key={o.id} opacity={dimOp} style={{ cursor: "pointer" }}
                onClick={() => {
                  if (movedRef.current) { movedRef.current = false; return; }
                  onClick && onClick(o.id);
                }}>
                <line x1={x0} x2={x0} y1={yPx(Math.min(o.maxY, yMax))} y2={yPx(Math.max(o.minY, yMin))} stroke="rgba(17,24,39,0.25)" strokeDasharray="2 3"/>
                {o.ranges.map((r, ri) => {
                  const d = bulgePath(o, r, x0);
                  if (!d) return null;
                  return (
                    <path key={ri} d={d}
                      fill={fillCol}
                      stroke="rgba(17,24,39,0.67)" strokeWidth="0.9"
                      onMouseMove={(e) => {
                        if (dragRef.current) return;
                        const rect = ref.current.getBoundingClientRect();
                        const relY = (e.clientY - rect.top - pad.top) / plotH;
                        const yVal = Math.round(yMax - relY * (yMax - yMin));
                        const idx = yVal - o.minY;
                        const nv = (idx >= 0 && idx < o.normalized.length) ? o.normalized[idx] : 0;
                        const pc = (idx >= 0 && idx < o.percentages.length) ? o.percentages[idx] : 0;
                        const source = (o.counts && o.counts.length) ? o.counts : o.percentages;
                        let bestIdx = -1, bestVal = -Infinity;
                        for (let k = 0; k < source.length; k++) {
                          if (source[k] > bestVal) { bestVal = source[k]; bestIdx = k; }
                        }
                        const bestY = bestIdx >= 0 ? o.minY + bestIdx : null;
                        const bestPc = bestIdx >= 0 && bestIdx < o.percentages.length ? o.percentages[bestIdx] : 0;
                        const html = `<div class="t-head"><span class="t-sw" style="background:${safeColor(o.color)}"></span><span class="t-lbl">${escapeHtml(o.label)}</span></div>`+
                          `<div class="t-y">Y = <b>${yVal}</b></div>`+
                          `<div class="t-y">Range: <b>${escapeHtml(spawnRangeText(o))}</b></div>`+
                          `<div class="t-n">${(pc*100).toFixed(2)}% <span class="u">of ore</span></div>`+
                          `<div class="t-n" style="margin-top:1px">${nv.toFixed(2)} <span class="u">normalized</span></div>`+
                          (bestY !== null ? `<div class="t-n" style="margin-top:4px;border-top:1px solid var(--border);padding-top:4px">Best Y: <b>${bestY}</b> <span class="u">(${(bestPc*100).toFixed(2)}%)</span></div>` : "");
                        const aria = `${o.label} at Y ${yVal}, ${(pc*100).toFixed(2)} percent of ore${bestY !== null ? `, peaks at Y ${bestY}` : ""}`;
                        showTip(tipRef, e, ref.current, html, aria);
                      }}
                      onMouseLeave={() => hideTip(tipRef)}
                    />
                  );
                })}
              </g>
            );
          })}

          {singleOre && yTicks.map((yLvl, i) => {
            const idx = Math.round(yLvl) - singleOre.minY;
            if (idx < 0 || idx >= singleOre.percentages.length) return null;
            const inRange = singleOre.ranges.some(r => yLvl >= r.minY && yLvl <= r.maxY);
            if (!inRange) return null;
            const pc = singleOre.percentages[idx];
            if (pc <= 0) return null;
            const x0 = pad.left + 0 * colW + 4;
            const half = colW * 0.42;
            const nv = singleOre.normalized[idx] || 0;
            return (
              <text key={`vl${i}`} x={x0 + nv * half + 6} y={yPx(yLvl) + 4}
                fontSize="10.5" fontFamily="JetBrains Mono, monospace" fill="var(--text)" fontWeight="600">
                {(pc * 100).toFixed(2)}%
              </text>
            );
          })}
        </g>

        {visible.map((o, i) => {
          const x0 = pad.left + i * colW + 4;
          return (
            <g key={`lbl-${o.id}`} transform={`translate(${x0 + colW * 0.18}, ${pad.top + plotH + 14}) rotate(-48)`}>
              <text fontSize="11" fontFamily="Inter, sans-serif" fill="var(--text)" textAnchor="end" dominantBaseline="central">{o.label}</text>
            </g>
          );
        })}

        <rect x={pad.left} y={pad.top} width={plotW} height={plotH} fill="none" stroke="var(--axis)" strokeWidth="1" pointerEvents="none"/>
        <text x={14} y={pad.top + plotH / 2} textAnchor="middle" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="600" fill="var(--text)" transform={`rotate(-90 14 ${pad.top + plotH / 2})`}>Y Level</text>

        {!visible.length && (
          <text x={contentW / 2} y={h / 2} textAnchor="middle" fontSize="12" fill="var(--muted)" fontFamily="JetBrains Mono, monospace">No ores selected</text>
        )}
      </svg>
      <div ref={tipRef} className="tip" role="status" aria-live="polite" aria-atomic="true"/>
    </div>
  );
}

export default memo(DistributionViolin);

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { niceStep, useViewport, clampView, safeId } from "../lib/chart-math";
import { escapeHtml, safeColor } from "../lib/colors";
import { showTip, hideTip } from "../lib/tooltip";
import { spawnRangeText } from "../lib/ores";

const BAR_W = 5;
const DOT_R = 2.5;

function rangesText(o) {
  return (o.ranges || []).map(r => r.minY === r.maxY ? `${r.minY}` : `${r.minY} to ${r.maxY}`).join(", ");
}

function SpawnRangeBar({ ores, hidden, solo, onClick, dim }) {
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

  function tooltipFor(o, e) {
    const html = `<div class="t-head"><span class="t-sw" style="background:${safeColor(o.color)}"></span><span class="t-lbl">${escapeHtml(o.label)}</span></div>`+
      `<div class="t-y">Range: <b>${escapeHtml(spawnRangeText(o))}</b></div>`+
      ((o.ranges || []).length > 1 ? `<div class="t-y">Segments: <b>${escapeHtml(rangesText(o))}</b></div>` : "")+
      (typeof o.perChunk === "number" ? `<div class="t-n" style="margin-top:1px">${o.perChunk.toFixed(2)} <span class="u">per chunk</span></div>` : "")+
      (typeof o.totalCount === "number" ? `<div class="t-n">${o.totalCount} <span class="u">total blocks</span></div>` : "");
    const aria = `${o.label}, range ${spawnRangeText(o)}${typeof o.perChunk === "number" ? `, ${o.perChunk.toFixed(2)} per chunk` : ""}`;
    showTip(tipRef, e, ref.current, html, aria);
  }

  return (
    <div ref={ref} className="scrollx graph-pan" style={{ width: "100%", position: "relative" }}>
      <svg className="card-svg" width={contentW} height={h} role="img" aria-label="Ore spawn range bars by ore"
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
          <clipPath id={`srclip-${safeId(dim.id)}`}>
            <rect x={pad.left} y={pad.top} width={plotW} height={plotH}/>
          </clipPath>
        </defs>
        <g clipPath={`url(#srclip-${safeId(dim.id)})`}>
          {visible.map((o, i) => {
            const cx = pad.left + i * colW + colW / 2;
            const dimOp = solo && solo !== o.id ? 0.18 : 1;
            return (
              <g key={o.id} opacity={dimOp} style={{ cursor: "pointer" }}
                onClick={() => {
                  if (movedRef.current) { movedRef.current = false; return; }
                  onClick && onClick(o.id);
                }}
                onMouseMove={(e) => { if (!dragRef.current) tooltipFor(o, e); }}
                onMouseLeave={() => hideTip(tipRef)}>
                {(o.ranges || []).map((r, ri) => {
                  if (r.maxY === r.minY) {
                    return (
                      <circle key={ri} cx={cx} cy={yPx(r.minY)} r={DOT_R}
                        fill={o.color} stroke="rgba(17,24,39,0.6)" strokeWidth="0.5"/>
                    );
                  }
                  const yTop = yPx(r.maxY);
                  const yBot = yPx(r.minY);
                  return (
                    <rect key={ri} x={cx - BAR_W / 2} y={yTop} width={BAR_W} height={Math.max(1, yBot - yTop)}
                      fill={o.color} stroke="rgba(17,24,39,0.6)" strokeWidth="0.5"/>
                  );
                })}
              </g>
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

export default memo(SpawnRangeBar);

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { niceStep, fmtDensity, useViewport, clampView, chartKeyHandler, safeId } from "../lib/chart-math";
import { escapeHtml, safeColor } from "../lib/colors";
import { showTip, hideTip } from "../lib/tooltip";
import { spawnRangeText, maxObservedSpawnY } from "../lib/ores";

function DensityLine({ ores, hidden, solo, onClick, mode, dim }) {
  const ref = useRef(null);
  const tipRef = useRef(null);
  const dragRef = useRef(null);
  const rafRef = useRef(0);
  const [w, setW] = useState(560);
  const h = 640;

  useEffect(() => {
    const on = () => ref.current && setW(ref.current.clientWidth);
    on(); window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  const visible = useMemo(() => ores.filter(o => !hidden[o.id]), [ores, hidden]);
  const dataMinY = dim.minY;
  const dataMaxY = useMemo(() => maxObservedSpawnY(ores, dim.maxY), [ores, dim.maxY]);
  const [view, setView] = useViewport(dataMinY, dataMaxY, `${dim.id}:${dataMaxY}`);
  const [viewMin, viewMax] = view;
  const fillUnder = visible.length <= 6;
  const field = mode === "normalized" ? "normalized" : "percentages";
  const singleOre = visible.length === 1 ? visible[0] : null;

  const densMax = useMemo(() => {
    let m = 0;
    for (const o of visible) {
      for (let y = Math.ceil(viewMin); y <= Math.floor(viewMax); y++) {
        const idx = y - o.minY;
        if (idx < 0 || idx >= o[field].length) continue;
        if (o[field][idx] > m) m = o[field][idx];
      }
    }
    if (m <= 0) m = mode === "normalized" ? 1 : 0.01;
    return m * 1.08;
  }, [visible, viewMin, viewMax, field, mode]);

  const pad = { top: 18, right: 24, bottom: 44, left: 62 };
  const plotW = Math.max(40, w - pad.left - pad.right);
  const plotH = h - pad.top - pad.bottom;

  const xPx = (y) => pad.left + ((y - viewMin) / Math.max(1, viewMax - viewMin)) * plotW;
  const yPx = (d) => pad.top + (1 - Math.min(1, d / densMax)) * plotH;

  const xStep = niceStep(viewMax - viewMin);
  const xTicks = [];
  for (let y = Math.ceil(viewMin / xStep) * xStep; y <= viewMax; y += xStep) xTicks.push(y);
  const dStep = niceStep(densMax);
  const dTicks = [];
  for (let v = 0; v <= densMax; v += dStep) dTicks.push(v);

  const pathFor = (o) => {
    const segs = [];
    let cur = "";
    const yLo = Math.max(dataMinY, Math.floor(viewMin) - 1);
    const yHi = Math.min(dataMaxY, Math.ceil(viewMax) + 1);
    for (let y = yLo; y <= yHi; y++) {
      const idx = y - o.minY;
      const inRange = idx >= 0 && idx < o[field].length && o.ranges.some(r => y >= r.minY && y <= r.maxY);
      if (!inRange) { if (cur) segs.push(cur); cur = ""; continue; }
      const v = o[field][idx];
      const px = xPx(y), py = yPx(v);
      cur += (cur ? " L " : "M ") + px.toFixed(1) + " " + py.toFixed(1);
    }
    if (cur) segs.push(cur);
    return segs;
  };
  const fillFor = (o, segs) => {
    const baseY = yPx(0);
    return segs.map(line => {
      const pts = line.slice(2).split(" L ").map(p => p.split(" ").map(Number));
      if (!pts.length) return "";
      const first = pts[0], last = pts[pts.length - 1];
      return `M ${first[0]} ${baseY} L ${pts.map(p => p.join(" ")).join(" L ")} L ${last[0]} ${baseY} Z`;
    }).join(" ");
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e) => {
      const rect = el.getBoundingClientRect();
      const relX = (e.clientX - rect.left - pad.left) / plotW;
      if (relX < 0 || relX > 1) return;
      e.preventDefault();
      const focal = viewMin + relX * (viewMax - viewMin);
      const factor = e.deltaY > 0 ? 1.18 : 1 / 1.18;
      const newSpan = (viewMax - viewMin) * factor;
      const newMin = focal - (focal - viewMin) * factor;
      const newMax = newMin + newSpan;
      setView(clampView(newMin, newMax, dataMinY, dataMaxY, 4));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [viewMin, viewMax, dataMinY, dataMaxY, plotW, pad.left, setView]);

  const onMouseDownPan = (e) => {
    if (e.button !== 0) return;
    dragRef.current = { x0: e.clientX, v0: [viewMin, viewMax] };
    hideTip(tipRef);
  };
  const onMouseMovePan = (e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x0;
    const [mn, mx] = dragRef.current.v0;
    const u = (mx - mn) / plotW;
    const d = -dx * u;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setView(clampView(mn + d, mx + d, dataMinY, dataMaxY, 4));
    });
  };
  useEffect(() => {
    const up = () => { dragRef.current = null; };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);
  const onDblClick = () => setView([dataMinY, dataMaxY]);

  return (
    <div ref={ref} tabIndex={0} role="group"
      aria-label="Ore density chart, arrow keys pan, plus minus zoom, Home reset"
      aria-keyshortcuts="ArrowLeft ArrowRight + - Home"
      onKeyDown={chartKeyHandler(setView, viewMin, viewMax, dataMinY, dataMaxY)}
      style={{ width: "100%", position: "relative" }}>
      <svg className="card-svg" width={w} height={h} role="img" aria-label="Ore density line chart by Y level"
        style={{ cursor: dragRef.current ? "grabbing" : "grab" }}
        onMouseDown={onMouseDownPan}
        onMouseMove={onMouseMovePan}
        onDoubleClick={onDblClick}>
        <rect x="0" y="0" width={w} height={h} fill="var(--panel)"/>
        {dTicks.map((v, i) => {
          const py = yPx(v);
          return (
            <g key={`d${i}`}>
              <line x1={pad.left} x2={pad.left + plotW} y1={py} y2={py} stroke="var(--grid)"/>
              <text x={pad.left - 8} y={py + 4} textAnchor="end" fontSize="11" fontFamily="Inter, sans-serif" fill="var(--axis)">{fmtDensity(v, mode)}</text>
            </g>
          );
        })}
        {xTicks.map((y, i) => {
          const px = xPx(y);
          return (
            <g key={`x${i}`}>
              <line x1={px} x2={px} y1={pad.top} y2={pad.top + plotH} stroke="var(--grid)"/>
              <text x={px} y={pad.top + plotH + 16} textAnchor="middle" fontSize="11" fontFamily="Inter, sans-serif" fill="var(--axis)">{y}</text>
            </g>
          );
        })}

        <defs>
          <clipPath id={`clip-${mode}-${safeId(dim.id)}`}>
            <rect x={pad.left} y={pad.top} width={plotW} height={plotH}/>
          </clipPath>
        </defs>
        <g clipPath={`url(#clip-${mode}-${safeId(dim.id)})`}>
          {visible.map(o => {
            const segs = pathFor(o);
            if (!segs.length) return null;
            const dimOp = solo && solo !== o.id ? 0.22 : 1;
            return (
              <g key={o.id} opacity={dimOp} style={{ cursor: "pointer" }} onClick={() => onClick && onClick(o.id)}>
                {fillUnder && (
                  <path d={fillFor(o, segs)} fill={o.color} fillOpacity={36/255} />
                )}
                {segs.map((s, i) => (
                  <path key={i} d={s} stroke={o.color} strokeWidth={solo === o.id ? 2.8 : 2.2} fill="none"
                    strokeLinecap="round" strokeLinejoin="round" />
                ))}
              </g>
            );
          })}

          {singleOre && xTicks.map((yLvl, i) => {
            const idx = Math.round(yLvl) - singleOre.minY;
            if (idx < 0 || idx >= singleOre[field].length) return null;
            const inRange = singleOre.ranges.some(r => yLvl >= r.minY && yLvl <= r.maxY);
            if (!inRange) return null;
            const v = singleOre[field][idx];
            if (v <= 0) return null;
            return (
              <text key={`vl${i}`} x={xPx(yLvl)} y={yPx(v) - 8} textAnchor="middle" fontSize="10.5"
                fontFamily="JetBrains Mono, monospace" fill="var(--text)" fontWeight="600">
                {fmtDensity(v, mode)}
              </text>
            );
          })}
        </g>

        <rect x={pad.left} y={pad.top} width={plotW} height={plotH} fill="transparent"
          onMouseMove={(e) => {
            if (dragRef.current) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width;
            const yVal = Math.round(viewMin + relX * (viewMax - viewMin));
            const rows = visible.map(o => {
              const idx = yVal - o.minY;
              const inRange = idx >= 0 && idx < o[field].length && o.ranges.some(r => yVal >= r.minY && yVal <= r.maxY);
              const v = inRange ? o[field][idx] : 0;
              return { o, v };
            }).filter(r => r.v > 0).sort((a, b) => b.v - a.v).slice(0, 7);
            const html = `<div class="t-y">Y = <b>${yVal}</b></div>` +
              (rows.length
                ? rows.map(r => `<div class="t-head"><span class="t-sw" style="background:${safeColor(r.o.color)}"></span><span class="t-lbl">${escapeHtml(r.o.label)}</span><span class="t-n" style="margin-left:auto">${escapeHtml(fmtDensity(r.v, mode))}</span></div><div class="t-y" style="margin:-1px 0 5px 15px">Range: <b>${escapeHtml(spawnRangeText(r.o))}</b></div>`).join("")
                : `<div class="t-y" style="margin-top:4px">no ores at this Y</div>`);
            const aria = rows.length ? `Y ${yVal}, ${rows.map(r => `${r.o.label} ${fmtDensity(r.v, mode)}`).join(", ")}` : `Y ${yVal}, no ores`;
            showTip(tipRef, e, ref.current, html, aria);
          }}
          onMouseLeave={() => hideTip(tipRef)}
          style={{ pointerEvents: dragRef.current ? "none" : "auto" }} />

        <rect x={pad.left} y={pad.top} width={plotW} height={plotH} fill="none" stroke="var(--axis)" strokeWidth="1" pointerEvents="none"/>
        <text x={pad.left + plotW / 2} y={h - 6} textAnchor="middle" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="600" fill="var(--text)">Y Level</text>
        <text x={16} y={pad.top + plotH / 2} textAnchor="middle" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="600" fill="var(--text)" transform={`rotate(-90 16 ${pad.top + plotH / 2})`}>{mode === "normalized" ? "Normalized Density" : "Ore Density"}</text>

        {!visible.length && (
          <text x={w/2} y={h/2} textAnchor="middle" fontSize="12" fill="var(--muted)" fontFamily="JetBrains Mono, monospace">No ores selected</text>
        )}
      </svg>
      <div ref={tipRef} className="tip" role="status" aria-live="polite" aria-atomic="true"/>
    </div>
  );
}

export default memo(DensityLine);

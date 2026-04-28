/* global React, ReactDOM */
const { useState, useEffect, useRef, useMemo } = React;

/* ── icons ───────────────────────────────────────────────────── */
function GithubIcon() {
  return (
    <svg className="ic" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.42 7.42 0 012-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/>
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg className="ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M8 2v8m0 0L4.5 6.5M8 10l3.5-3.5M3 13h10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function LogoMark() {
  const cells = ["#4DD0E1", "#D7CCC8", "#FFD54F", "#FF7043", "#E53935", "#66BB6A", "#1E88E5", "#424242", "#B0BEC5"];
  return (
    <div className="logo-mark" aria-hidden="true">
      {cells.map((c, i) => <span key={i} style={{ background: c }} />)}
    </div>
  );
}

function ThemeToggle() {
  return (
    <button className="theme-toggle" type="button" aria-label="Toggle theme"
      onClick={() => window.__oresourceTheme && window.__oresourceTheme.toggle()}>
      <svg className="ic-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      <svg className="ic-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
    </button>
  );
}

/* ── helpers ─────────────────────────────────────────────────── */
function niceStep(range) {
  if (range <= 0) return 1;
  const approx = range / 5;
  const pow = Math.pow(10, Math.floor(Math.log10(approx)));
  const n = approx / pow;
  let mult = 1;
  if (n >= 7) mult = 10;
  else if (n >= 3) mult = 5;
  else if (n >= 1.5) mult = 2;
  return mult * pow;
}
function fmtDensity(v, mode) {
  if (mode === "normalized") return v.toFixed(2);
  const p = v * 100;
  if (p >= 10) return p.toFixed(0) + "%";
  if (p >= 1) return p.toFixed(1) + "%";
  return p.toFixed(2) + "%";
}
function showTip(tipRef, e, container, html) {
  const tip = tipRef.current; if (!tip || !container) return;
  tip.innerHTML = html;
  const rect = container.getBoundingClientRect();
  const tipW = tip.offsetWidth || 180, tipH = tip.offsetHeight || 80;
  const scrollX = container.scrollLeft || 0;
  const minX = scrollX + 4;
  const maxX = scrollX + rect.width - 4;
  let x = e.clientX - rect.left + scrollX + 14;
  let y = e.clientY - rect.top + 14;
  if (x + tipW > maxX) x = e.clientX - rect.left + scrollX - tipW - 14;
  if (y + tipH > rect.height - 4) y = e.clientY - rect.top - tipH - 14;
  tip.style.left = Math.max(minX, x) + "px";
  tip.style.top = Math.max(4, y) + "px";
  tip.style.opacity = 1;
}
function hideTip(tipRef) { if (tipRef.current) tipRef.current.style.opacity = 0; }
function safeId(s) { return String(s).replace(/[^a-zA-Z0-9_-]/g, "_"); }

/* ── zoom/pan shared state ── */
function useViewport(dataMin, dataMax, resetKey) {
  const [view, setView] = useState([dataMin, dataMax]);
  useEffect(() => { setView([dataMin, dataMax]); }, [dataMin, dataMax, resetKey]);
  return [view, setView];
}
function clampView(newMin, newMax, dataMin, dataMax, minRange) {
  let span = Math.max(minRange, newMax - newMin);
  if (span > dataMax - dataMin) span = dataMax - dataMin;
  if (newMin < dataMin) { newMin = dataMin; newMax = newMin + span; }
  if (newMax > dataMax) { newMax = dataMax; newMin = newMax - span; }
  if (newMin < dataMin) newMin = dataMin;
  return [newMin, newMax];
}
function oreTotal(o) {
  if (typeof o.totalCount === "number") return o.totalCount;
  return (o.counts || []).reduce((sum, count) => sum + (count || 0), 0);
}
function isOverworldDimension(dimId) {
  return dimId === "minecraft:overworld" || dimId === "overworld";
}
function isNetherOreId(id) {
  const value = String(id);
  return value.includes("nether") && value.includes("ore");
}
function isSparseOre(o, chunksScanned) {
  if (!chunksScanned) return false;
  const limit = Math.max(8, chunksScanned * 0.01);
  return oreTotal(o) < limit;
}
function visibleOreData(dim, ores) {
  if (!isOverworldDimension(dim.id)) return ores;
  return ores.filter(o => !isNetherOreId(o.id) && !isSparseOre(o, dim.chunksScanned || 0));
}
function spawnRangeText(o) {
  return o.minY === o.maxY ? `${o.minY}` : `${o.minY} to ${o.maxY}`;
}
function maxObservedSpawnY(ores, fallback) {
  let best = -Infinity;
  for (const o of ores) {
    for (const r of o.ranges || []) best = Math.max(best, r.maxY);
    const counts = o.counts || [];
    for (let i = counts.length - 1; i >= 0; i--) {
      if ((counts[i] || 0) > 0) {
        best = Math.max(best, o.minY + i);
        break;
      }
    }
  }
  return best === -Infinity ? fallback : Math.min(fallback, best);
}

/* ── GRAPH 1: Ore Density line chart (Y-level on X, density on Y) ── */
function DensityLine({ ores, hidden, solo, onClick, mode, dim }) {
  const ref = useRef(null);
  const tipRef = useRef(null);
  const dragRef = useRef(null);
  const [w, setW] = useState(560);
  const h = 640;
  useEffect(() => {
    const on = () => ref.current && setW(ref.current.clientWidth);
    on(); window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  const visible = ores.filter(o => !hidden[o.id]);
  const dataMinY = dim.minY, dataMaxY = maxObservedSpawnY(ores, dim.maxY);
  const [view, setView] = useViewport(dataMinY, dataMaxY, `${dim.id}:${dataMaxY}`);
  const [viewMin, viewMax] = view;
  const fillUnder = visible.length;
  const field = mode === "normalized" ? "normalized" : "percentages";
  const singleOre = visible.length === 1 ? visible[0] : null;

  let densMax = 0;
  for (const o of visible) {
    for (let y = Math.ceil(viewMin); y <= Math.floor(viewMax); y++) {
      const idx = y - o.minY;
      if (idx < 0 || idx >= o[field].length) continue;
      if (o[field][idx] > densMax) densMax = o[field][idx];
    }
  }
  if (densMax <= 0) densMax = mode === "normalized" ? 1 : 0.01;
  densMax *= 1.08;

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
  }, [viewMin, viewMax, dataMinY, dataMaxY, plotW, pad.left]);
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
    setView(clampView(mn + d, mx + d, dataMinY, dataMaxY, 4));
  };
  const onMouseUpPan = () => { dragRef.current = null; };
  useEffect(() => {
    window.addEventListener("mouseup", onMouseUpPan);
    return () => window.removeEventListener("mouseup", onMouseUpPan);
  }, []);
  const onDblClick = () => setView([dataMinY, dataMaxY]);

  return (
    <div ref={ref} style={{ width: "100%", position: "relative" }}>
      <svg className="card-svg" width={w} height={h} role="img" aria-label="Ore density line chart by Y level"
        style={{ cursor: dragRef.current ? "grabbing" : "grab" }}
        onMouseDown={onMouseDownPan}
        onMouseMove={onMouseMovePan}
        onDoubleClick={onDblClick}>
        <rect x="0" y="0" width={w} height={h} fill="var(--panel)"/>
        {/* grid */}
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

        {/* clip curves to plot area so pan/zoom doesn't spill */}
        <defs>
          <clipPath id={`clip-${mode}-${safeId(dim.id)}`}>
            <rect x={pad.left} y={pad.top} width={plotW} height={plotH}/>
          </clipPath>
        </defs>
        <g clipPath={`url(#clip-${mode}-${safeId(dim.id)})`}>
          {visible.map(o => {
            const segs = pathFor(o);
            if (!segs.length) return null;
            const dim = solo && solo !== o.id ? 0.22 : 1;
            return (
              <g key={o.id} opacity={dim} style={{ cursor: "pointer" }} onClick={() => onClick && onClick(o.id)}>
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

          {/* value labels when exactly one ore visible */}
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

        {/* hover capture (only when not dragging) */}
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
                ? rows.map(r => `<div class="t-head"><span class="t-sw" style="background:${r.o.color}"></span><span class="t-lbl">${r.o.label}</span><span class="t-n" style="margin-left:auto">${fmtDensity(r.v, mode)}</span></div><div class="t-y" style="margin:-1px 0 5px 15px">Range: <b>${spawnRangeText(r.o)}</b></div>`).join("")
                : `<div class="t-y" style="margin-top:4px">no ores at this Y</div>`);
            showTip(tipRef, e, ref.current, html);
          }}
          onMouseLeave={() => hideTip(tipRef)}
          style={{ pointerEvents: dragRef.current ? "none" : "auto" }} />

        {/* border */}
        <rect x={pad.left} y={pad.top} width={plotW} height={plotH} fill="none" stroke="var(--axis)" strokeWidth="1" pointerEvents="none"/>
        {/* axis titles */}
        <text x={pad.left + plotW / 2} y={h - 6} textAnchor="middle" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="600" fill="var(--text)">Y Level</text>
        <text x={16} y={pad.top + plotH / 2} textAnchor="middle" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="600" fill="var(--text)" transform={`rotate(-90 16 ${pad.top + plotH / 2})`}>{mode === "normalized" ? "Normalized Density" : "Ore Density"}</text>

        {!visible.length && (
          <text x={w/2} y={h/2} textAnchor="middle" fontSize="12" fill="var(--muted)" fontFamily="JetBrains Mono, monospace">No ores selected</text>
        )}
      </svg>
      <div ref={tipRef} className="tip"/>
    </div>
  );
}

/* ── GRAPH 2: Ridgeline / Violin (Y on Y-axis, one column per ore) ── */
function DistributionViolin({ ores, hidden, solo, onClick, dim }) {
  const ref = useRef(null);
  const tipRef = useRef(null);
  const dragRef = useRef(null);
  const movedRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [w, setW] = useState(560);
  useEffect(() => {
    const on = () => ref.current && setW(ref.current.clientWidth);
    on(); window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  let obsMin = Infinity, obsMax = -Infinity;
  for (const o of ores) {
    for (const r of (o.ranges || [])) {
      if (r.minY < obsMin) obsMin = r.minY;
      if (r.maxY > obsMax) obsMax = r.maxY;
    }
  }
  const dataYMin = obsMin === Infinity ? dim.minY : obsMin;
  const dataYMax = obsMax === -Infinity ? dim.maxY : obsMax;
  const [view, setView] = useViewport(dataYMin, dataYMax, dim.id);
  const [yMin, yMax] = view;

  const visible = ores.filter(o => !hidden[o.id]);
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
  }, [yMin, yMax, dataYMin, dataYMax, plotH, pad.top]);
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
    const onUp = (e) => {
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
                  if (movedRef.current) {
                    movedRef.current = false;
                    return;
                  }
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
                        const html = `<div class="t-head"><span class="t-sw" style="background:${o.color}"></span><span class="t-lbl">${o.label}</span></div>`+
                          `<div class="t-y">Y = <b>${yVal}</b></div>`+
                          `<div class="t-y">Range: <b>${spawnRangeText(o)}</b></div>`+
                          `<div class="t-n">${(pc*100).toFixed(2)}% <span class="u">of ore</span></div>`+
                          `<div class="t-n" style="margin-top:1px">${nv.toFixed(2)} <span class="u">normalized</span></div>`+
                          (bestY !== null ? `<div class="t-n" style="margin-top:4px;border-top:1px solid var(--border);padding-top:4px">Best Y: <b>${bestY}</b> <span class="u">(${(bestPc*100).toFixed(2)}%)</span></div>` : "");
                        showTip(tipRef, e, ref.current, html);
                      }}
                      onMouseLeave={() => hideTip(tipRef)}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Inline value labels when exactly one ore visible */}
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

        {/* column labels — outside clip so always visible */}
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
      <div ref={tipRef} className="tip"/>
    </div>
  );
}

/* ── GRAPH 3: Spawn Range bar chart (vertical min/max bar per ore) ── */
function SpawnRangeBar({ ores, hidden, solo, onClick, dim }) {
  const ref = useRef(null);
  const tipRef = useRef(null);
  const dragRef = useRef(null);
  const movedRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [w, setW] = useState(560);
  useEffect(() => {
    const on = () => ref.current && setW(ref.current.clientWidth);
    on(); window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  let obsMin = Infinity, obsMax = -Infinity;
  for (const o of ores) {
    for (const r of (o.ranges || [])) {
      if (r.minY < obsMin) obsMin = r.minY;
      if (r.maxY > obsMax) obsMax = r.maxY;
    }
  }
  const dataYMin = obsMin === Infinity ? dim.minY : obsMin;
  const dataYMax = obsMax === -Infinity ? dim.maxY : obsMax;
  const [view, setView] = useViewport(dataYMin, dataYMax, dim.id);
  const [yMin, yMax] = view;

  const visible = ores.filter(o => !hidden[o.id]);
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
  }, [yMin, yMax, dataYMin, dataYMax, plotH, pad.top]);
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
    const onUp = (e) => {
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

  const barW = 5;
  const dotR = 2.5;

  function rangesText(o) {
    return (o.ranges || []).map(r => r.minY === r.maxY ? `${r.minY}` : `${r.minY} to ${r.maxY}`).join(", ");
  }

  function tooltipFor(o, e) {
    const html = `<div class="t-head"><span class="t-sw" style="background:${o.color}"></span><span class="t-lbl">${o.label}</span></div>`+
      `<div class="t-y">Range: <b>${spawnRangeText(o)}</b></div>`+
      ((o.ranges || []).length > 1 ? `<div class="t-y">Segments: <b>${rangesText(o)}</b></div>` : "")+
      (typeof o.perChunk === "number" ? `<div class="t-n" style="margin-top:1px">${o.perChunk.toFixed(2)} <span class="u">per chunk</span></div>` : "")+
      (typeof o.totalCount === "number" ? `<div class="t-n">${o.totalCount} <span class="u">total blocks</span></div>` : "");
    showTip(tipRef, e, ref.current, html);
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
                  if (movedRef.current) {
                    movedRef.current = false;
                    return;
                  }
                  onClick && onClick(o.id);
                }}
                onMouseMove={(e) => { if (!dragRef.current) tooltipFor(o, e); }}
                onMouseLeave={() => hideTip(tipRef)}>
                {(o.ranges || []).map((r, ri) => {
                  if (r.maxY === r.minY) {
                    return (
                      <circle key={ri} cx={cx} cy={yPx(r.minY)} r={dotR}
                        fill={o.color} stroke="rgba(17,24,39,0.6)" strokeWidth="0.5"/>
                    );
                  }
                  const yTop = yPx(r.maxY);
                  const yBot = yPx(r.minY);
                  return (
                    <rect key={ri} x={cx - barW / 2} y={yTop} width={barW} height={Math.max(1, yBot - yTop)}
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
      <div ref={tipRef} className="tip"/>
    </div>
  );
}

function hexToRgba(hex, a) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ── Legend ─── */
function Legend({ ores, hidden, solo, onToggle, onSolo }) {
  if (!ores.length) return null;
  return (
    <div className="legend" role="group" aria-label="Ore legend">
      {ores.map((o) => {
        const off = !!hidden[o.id];
        const isSolo = solo === o.id;
        return (
          <button key={o.id}
            className={"leg-item " + (off ? "off " : "") + (isSolo ? "solo" : "")}
            onClick={() => onToggle(o.id)}
            onDoubleClick={() => onSolo(o.id)}
            aria-pressed={!off}
            title="Click to toggle · Double-click to solo">
            <span className="leg-sw" style={{ background: o.color }} />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Optimizer: ore picker, score line, pie chart ─── */
function OrePicker({ ores, selected, search, setSearch, onAdd, onRemove, onWeight, onClear, onSelectAll }) {
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
              <button key={o.id} className="opt-pick-row" onClick={() => onAdd(o.id)}>
                <span className="leg-sw" style={{ background: o.color }}/>
                <span className="opt-pick-name">{o.label}</span>
                <span className="opt-pick-id">{o.id}</span>
                <span className="opt-pick-add">+</span>
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

function ScoreLine({ dim, scoreSeries, scoreMode, showDeriv, pieY, onPickY }) {
  const ref = useRef(null);
  const tipRef = useRef(null);
  const dragRef = useRef(null);
  const movedRef = useRef(false);
  const [w, setW] = useState(560);
  const h = 460;
  useEffect(() => {
    const on = () => ref.current && setW(ref.current.clientWidth);
    on(); window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  const { score, dscore, contributors, bestY } = scoreSeries;
  const dataMinY = dim.minY, dataMaxY = dim.maxY;
  const [view, setView] = useViewport(dataMinY, dataMaxY, dim.id);
  const [viewMin, viewMax] = view;

  const pad = { top: 18, right: showDeriv ? 56 : 24, bottom: 44, left: 64 };
  const plotW = Math.max(40, w - pad.left - pad.right);
  const plotH = h - pad.top - pad.bottom;

  let scoreMax = 0;
  for (let y = Math.ceil(viewMin); y <= Math.floor(viewMax); y++) {
    const i = y - dataMinY;
    if (i < 0 || i >= score.length) continue;
    if (score[i] > scoreMax) scoreMax = score[i];
  }
  if (scoreMax <= 0) scoreMax = scoreMode === "percentage" ? 0.01 : 1;
  scoreMax *= 1.08;

  let dAbs = 0;
  if (showDeriv) {
    for (let y = Math.ceil(viewMin); y <= Math.floor(viewMax); y++) {
      const i = y - dataMinY;
      if (i < 0 || i >= dscore.length) continue;
      const a = Math.abs(dscore[i]);
      if (a > dAbs) dAbs = a;
    }
    if (dAbs <= 0) dAbs = 1;
    dAbs *= 1.15;
  }

  const xPx = (y) => pad.left + ((y - viewMin) / Math.max(1, viewMax - viewMin)) * plotW;
  const yPxScore = (v) => pad.top + (1 - Math.min(1, v / scoreMax)) * plotH;
  const yPxDeriv = (v) => pad.top + plotH * 0.5 - (v / dAbs) * plotH * 0.45;

  const xStep = niceStep(viewMax - viewMin);
  const xTicks = [];
  for (let y = Math.ceil(viewMin / xStep) * xStep; y <= viewMax; y += xStep) xTicks.push(y);
  const sStep = niceStep(scoreMax);
  const sTicks = [];
  for (let v = 0; v <= scoreMax; v += sStep) sTicks.push(v);

  const buildPath = (arr, mapY) => {
    const yLo = Math.max(dataMinY, Math.floor(viewMin) - 1);
    const yHi = Math.min(dataMaxY, Math.ceil(viewMax) + 1);
    let d = "";
    for (let y = yLo; y <= yHi; y++) {
      const i = y - dataMinY;
      if (i < 0 || i >= arr.length) continue;
      const px = xPx(y), py = mapY(arr[i]);
      d += (d ? " L " : "M ") + px.toFixed(1) + " " + py.toFixed(1);
    }
    return d;
  };
  const scorePath = buildPath(score, yPxScore);
  const derivPath = showDeriv ? buildPath(dscore, yPxDeriv) : "";

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
  }, [viewMin, viewMax, dataMinY, dataMaxY, plotW, pad.left]);

  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    dragRef.current = { x0: e.clientX, v0: [viewMin, viewMax] };
    movedRef.current = false;
    hideTip(tipRef);
  };
  const onMouseMovePan = (e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x0;
    if (Math.abs(dx) > 3) movedRef.current = true;
    const [mn, mx] = dragRef.current.v0;
    const u = (mx - mn) / plotW;
    setView(clampView(mn - dx * u, mx - dx * u, dataMinY, dataMaxY, 4));
  };
  const onMouseUpPan = () => { dragRef.current = null; };
  useEffect(() => {
    window.addEventListener("mouseup", onMouseUpPan);
    return () => window.removeEventListener("mouseup", onMouseUpPan);
  }, []);
  const onDblClick = () => { setView([dataMinY, dataMaxY]); onPickY && onPickY(null); };

  const guideY = pieY != null ? pieY : null;
  const onPlotClick = (e) => {
    if (movedRef.current) { movedRef.current = false; return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const yVal = Math.round(viewMin + relX * (viewMax - viewMin));
    onPickY && onPickY(yVal);
  };

  const fmtScore = (v) => scoreMode === "percentage"
    ? (v * 100).toFixed(v < 0.0001 ? 3 : 2) + "%"
    : v.toFixed(v < 0.01 ? 4 : v < 1 ? 3 : v < 10 ? 2 : 1);

  return (
    <div ref={ref} style={{ width: "100%", position: "relative" }}>
      <svg className="card-svg" width={w} height={h} role="img" aria-label="Y-level optimizer score chart"
        style={{ cursor: dragRef.current ? "grabbing" : "grab" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMovePan}
        onDoubleClick={onDblClick}>
        <rect x="0" y="0" width={w} height={h} fill="var(--panel)"/>
        {sTicks.map((v, i) => {
          const py = yPxScore(v);
          return (
            <g key={`s${i}`}>
              <line x1={pad.left} x2={pad.left + plotW} y1={py} y2={py} stroke="var(--grid)"/>
              <text x={pad.left - 8} y={py + 4} textAnchor="end" fontSize="11" fontFamily="Inter, sans-serif" fill="var(--axis)">
                {fmtScore(v)}
              </text>
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
          <clipPath id={`clip-opt-${safeId(dim.id)}`}>
            <rect x={pad.left} y={pad.top} width={plotW} height={plotH}/>
          </clipPath>
        </defs>
        <g clipPath={`url(#clip-opt-${safeId(dim.id)})`}>
          {scorePath && (
            <path d={scorePath} stroke="var(--accent)" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          )}
          {showDeriv && (
            <line x1={pad.left} x2={pad.left + plotW} y1={yPxDeriv(0)} y2={yPxDeriv(0)} stroke="var(--scroll-thumb)" strokeDasharray="3 3" />
          )}
          {showDeriv && derivPath && (
            <path d={derivPath} stroke="var(--danger)" strokeWidth="1.4" fill="none" strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round" />
          )}
          {bestY != null && (
            <g>
              <line x1={xPx(bestY)} x2={xPx(bestY)} y1={pad.top} y2={pad.top + plotH} stroke="var(--success)" strokeWidth="1.4" strokeDasharray="2 3"/>
              <circle cx={xPx(bestY)} cy={yPxScore(score[bestY - dataMinY] || 0)} r="4.5" fill="var(--success)" stroke="var(--surface)" strokeWidth="1.5"/>
              <text x={xPx(bestY)} y={pad.top + 14} textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="700" fill="var(--success)">
                Best Y = {bestY}
              </text>
            </g>
          )}
          {guideY != null && guideY !== bestY && (
            <g>
              <line x1={xPx(guideY)} x2={xPx(guideY)} y1={pad.top} y2={pad.top + plotH} stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3 3"/>
              <text x={xPx(guideY)} y={pad.top + plotH - 6} textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono, monospace" fontWeight="700" fill="#b45309">
                Y = {guideY}
              </text>
            </g>
          )}
        </g>

        <rect x={pad.left} y={pad.top} width={plotW} height={plotH} fill="transparent"
          onClick={onPlotClick}
          onMouseMove={(e) => {
            if (dragRef.current) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width;
            const yVal = Math.round(viewMin + relX * (viewMax - viewMin));
            const i = yVal - dataMinY;
            const sVal = (i >= 0 && i < score.length) ? score[i] : 0;
            const dVal = (i >= 0 && i < dscore.length) ? dscore[i] : 0;
            const rows = (i >= 0 && contributors[i] ? contributors[i] : [])
              .slice().sort((a, b) => b.contrib - a.contrib).slice(0, 5);
            const html = `<div class="t-y">Y = <b style="color:var(--ink)">${yVal}</b></div>` +
              `<div class="t-y" style="margin-top:2px">score: <b style="color:var(--ink)">${fmtScore(sVal)}</b>${showDeriv ? ` &nbsp;d/dY: <b style="color:var(--danger)">${fmtScore(dVal)}</b>` : ""}</div>` +
              (rows.length
                ? rows.map(r => `<div class="t-head" style="margin-top:4px"><span class="t-sw" style="background:${r.color}"></span><span class="t-lbl">${r.label}</span><span class="t-n" style="margin-left:auto">${fmtScore(r.contrib)}</span></div>`).join("")
                : `<div class="t-y" style="margin-top:4px">no contributors at this Y</div>`);
            showTip(tipRef, e, ref.current, html);
          }}
          onMouseLeave={() => hideTip(tipRef)}
          style={{ pointerEvents: dragRef.current ? "none" : "auto", cursor: "crosshair" }} />

        <rect x={pad.left} y={pad.top} width={plotW} height={plotH} fill="none" stroke="var(--axis)" strokeWidth="1" pointerEvents="none"/>
        <text x={pad.left + plotW / 2} y={h - 6} textAnchor="middle" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="600" fill="var(--text)">Y Level</text>
        <text x={16} y={pad.top + plotH / 2} textAnchor="middle" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="600" fill="var(--text)" transform={`rotate(-90 16 ${pad.top + plotH / 2})`}>
          {scoreMode === "percentage" ? "Combined Density" : "Per-Chunk Count"}
        </text>
        {showDeriv && (
          <text x={w - 14} y={pad.top + plotH / 2} textAnchor="middle" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="600" fill="var(--danger)" transform={`rotate(90 ${w - 14} ${pad.top + plotH / 2})`}>
            d/dY
          </text>
        )}

        {bestY == null && (
          <text x={w/2} y={h/2} textAnchor="middle" fontSize="12" fill="var(--muted)" fontFamily="JetBrains Mono, monospace">
            Select 1+ ores to find the best Y
          </text>
        )}
      </svg>
      <div ref={tipRef} className="tip"/>
    </div>
  );
}

function OrePie({ pieData, y }) {
  const ref = useRef(null);
  const tipRef = useRef(null);
  const cx = 180, cy = 160, r = 130;
  const slices = pieData.slices;
  const fmtPct = (f) => (f * 100).toFixed(f < 0.001 ? 3 : (f < 0.01 ? 2 : 1)) + "%";
  return (
    <div ref={ref} className="opt-pie-wrap" style={{ position: "relative" }}>
      <svg className="card-svg" width="360" height="320" viewBox="0 0 360 320" role="img" aria-label="Block proportion pie at selected Y level">
        <rect x="0" y="0" width="360" height="320" fill="var(--panel)"/>
        {slices.length === 0 && (
          <text x={cx} y={cy} textAnchor="middle" fontSize="12" fill="var(--muted)" fontFamily="JetBrains Mono, monospace">
            Select ores to see pie
          </text>
        )}
        {slices.map((s) => {
          if (s.frac <= 0) return null;
          const x1 = cx + r * Math.cos(s.start), y1 = cy + r * Math.sin(s.start);
          const x2 = cx + r * Math.cos(s.end),   y2 = cy + r * Math.sin(s.end);
          const largeArc = (s.end - s.start) > Math.PI ? 1 : 0;
          const path = s.frac >= 0.9999
            ? `M ${cx-r} ${cy} A ${r} ${r} 0 1 1 ${cx+r} ${cy} A ${r} ${r} 0 1 1 ${cx-r} ${cy} Z`
            : `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
          return (
            <path key={s.id} d={path} fill={s.color} stroke="var(--surface)" strokeWidth="1.2"
              onMouseMove={(e) => {
                const html = `<div class="t-head"><span class="t-sw" style="background:${s.color}"></span><span class="t-lbl">${s.label}</span></div>` +
                  `<div class="t-y" style="margin-top:2px">count: <b style="color:var(--ink)">${s.count.toLocaleString()}</b></div>` +
                  `<div class="t-y">share: <b style="color:var(--ink)">${fmtPct(s.frac)}</b></div>`;
                showTip(tipRef, e, ref.current, html);
              }}
              onMouseLeave={() => hideTip(tipRef)} />
          );
        })}
        {slices.length > 0 && (
          <>
            <circle cx={cx} cy={cy} r={r * 0.42} fill="var(--panel)" stroke="var(--grid)" strokeWidth="1"/>
            <text x={cx} y={cy - 4} textAnchor="middle" fontSize="13" fontFamily="JetBrains Mono, monospace" fontWeight="700" fill="var(--ink)">
              Y = {y}
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono, monospace" fill="var(--muted)">
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
      <div ref={tipRef} className="tip"/>
    </div>
  );
}

/* ── Exports ─── */
function exportSvgPng(svgEl, filename, bg) {
  if (!svgEl) return;
  const rect = svgEl.getBoundingClientRect();
  const srcW = rect.width || +svgEl.getAttribute("width") || svgEl.clientWidth || 800;
  const srcH = rect.height || +svgEl.getAttribute("height") || svgEl.clientHeight || 600;
  const scale = 2;
  const outW = Math.round(srcW * scale);
  const outH = Math.round(srcH * scale);

  const cs = getComputedStyle(document.documentElement);
  const tokens = ["bg","panel","grid","axis","text","muted","border","ink","accent","surface","surface-alt","surface-hover","scroll-thumb","danger","success"];
  const inlineVars = tokens.map(t => `--${t}:${cs.getPropertyValue("--"+t).trim()}`).join(";");
  const fillBg = bg || cs.getPropertyValue("--panel").trim() || "#f8fafc";

  const clone = svgEl.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  clone.setAttribute("width", outW);
  clone.setAttribute("height", outH);
  clone.setAttribute("viewBox", `0 0 ${srcW} ${srcH}`);
  const existingStyle = clone.getAttribute("style") || "";
  clone.setAttribute("style", existingStyle + (existingStyle ? ";" : "") + inlineVars);

  let xml = new XMLSerializer().serializeToString(clone);
  if (!/^<svg[^>]+xmlns=/.test(xml)) {
    xml = xml.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);

  const img = new Image();
  img.decoding = "sync";
  img.onload = () => {
    try {
      const c = document.createElement("canvas");
      c.width = outW; c.height = outH;
      const cx = c.getContext("2d");
      cx.fillStyle = fillBg; cx.fillRect(0, 0, outW, outH);
      cx.drawImage(img, 0, 0, outW, outH);
      const finish = (blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      };
      c.toBlob((blob) => {
        if (blob) { finish(blob); return; }
        const pngDataUrl = c.toDataURL("image/png");
        fetch(pngDataUrl).then(r => r.blob()).then(finish).catch(err => {
          console.error("PNG export failed:", err);
          alert("PNG export failed. See console for details.");
        });
      }, "image/png");
    } catch (err) {
      console.error("PNG export draw failed:", err);
      alert("PNG export failed. See console for details.");
    }
  };
  img.onerror = (err) => {
    console.error("PNG export image load failed:", err);
    alert("PNG export failed: SVG could not be rasterized.");
  };
  img.src = dataUrl;
}
function exportCsv(rows, filename) {
  const csv = rows.map((r) => r.map((c) => {
    const s = String(c ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ── App ─── */
function ensureOreFields(o) {
  if (o.percentages && o.normalized && o.ranges) return o;
  const counts = o.counts || [];
  const sum = counts.reduce((a, b) => a + b, 0) || 1;
  const max = Math.max(...counts, 0.0001);
  return {
    ...o,
    percentages: o.percentages || counts.map(c => c / sum),
    normalized:  o.normalized  || counts.map(c => c / max),
    ranges:      o.ranges      || [{ minY: o.minY, maxY: o.maxY }],
  };
}

const ORE_MODIFIER_TOKENS = new Set([
  "deepslate", "nether", "end", "blackstone", "tuff", "granite", "diorite",
  "andesite", "calcite", "basalt", "sandstone", "raw", "dense", "poor",
  "rich", "small", "large", "tiny", "ore", "ores",
]);

function extractOreBase(path) {
  const tokens = path.split("_").filter(Boolean);
  const core = tokens.filter(t => !ORE_MODIFIER_TOKENS.has(t));
  return (core.length ? core : tokens).join("_");
}

function mergeOreVariants(ores) {
  const groups = new Map();
  for (const o of ores) {
    const raw = String(o.id);
    const colon = raw.indexOf(":");
    const ns = colon >= 0 ? raw.slice(0, colon) : "";
    const path = colon >= 0 ? raw.slice(colon + 1) : raw;
    const basePath = extractOreBase(path);
    const key = ns ? `${ns}:merged_${basePath}` : `merged_${basePath}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(o);
  }
  const out = [];
  for (const [key, members] of groups) {
    if (members.length === 1) { out.push(members[0]); continue; }
    const minY = Math.min(...members.map(m => m.minY));
    const maxY = Math.max(...members.map(m => m.maxY));
    const len = maxY - minY + 1;
    const counts = new Array(len).fill(0);
    for (const m of members) {
      const mc = m.counts || [];
      for (let i = 0; i < mc.length; i++) {
        const idx = (m.minY + i) - minY;
        if (idx >= 0 && idx < len) counts[idx] += mc[i] || 0;
      }
    }
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    const maxC = Math.max(...counts, 0.0001);
    const percentages = counts.map(c => c / total);
    const normalized = counts.map(c => c / maxC);
    const ranges = [];
    let inside = false, start = 0;
    for (let i = 0; i < counts.length; i++) {
      const has = counts[i] > 0;
      if (has && !inside) { start = minY + i; inside = true; }
      else if (!has && inside) { ranges.push({ minY: start, maxY: minY + i - 1 }); inside = false; }
    }
    if (inside) ranges.push({ minY: start, maxY: minY + counts.length - 1 });
    if (!ranges.length) ranges.push({ minY, maxY });
    const modifierCount = (m) => {
      const p = String(m.id).split(":").pop();
      return p.split("_").filter(t => ORE_MODIFIER_TOKENS.has(t) && t !== "ore").length;
    };
    const primary = [...members].sort((a, b) => modifierCount(a) - modifierCount(b))[0];
    const basePath = key.split(":").pop().replace(/^merged_/, "").replace(/_ore$/, "");
    const pretty = basePath.split("_").filter(Boolean)
      .map(p => p[0].toUpperCase() + p.slice(1)).join(" ");
    out.push({
      id: key,
      label: `All ${pretty} Ores`,
      color: primary.color,
      minY, maxY, counts, percentages, normalized, ranges,
      totalCount: total,
      perChunk: members.reduce((a, m) => a + (m.perChunk || 0), 0),
    });
  }
  return out;
}

function computeScoreSeries(dim, ores, selected, scoreMode, bucketSize) {
  const yMin = dim.minY, yMax = dim.maxY;
  const len = Math.max(1, yMax - yMin + 1);
  const score = new Array(len).fill(0);
  const dscore = new Array(len).fill(0);
  const contributors = new Array(len);
  const oresById = Object.fromEntries(ores.map(o => [o.id, o]));
  const chunks = Math.max(1, dim.chunksScanned || 1);
  const blocksAtY = chunks * 256 * (bucketSize || 1);
  const denom = scoreMode === "percentage" ? blocksAtY : chunks;
  let any = false;
  for (const oreId in selected) {
    const w = +selected[oreId];
    if (!w || !isFinite(w)) continue;
    const o = oresById[oreId];
    if (!o) continue;
    const arr = o.counts || [];
    for (let i = 0; i < arr.length; i++) {
      const v = ((arr[i] || 0) * w) / denom;
      if (v <= 0) continue;
      const idx = (o.minY + i) - yMin;
      if (idx < 0 || idx >= len) continue;
      score[idx] += v;
      if (!contributors[idx]) contributors[idx] = [];
      contributors[idx].push({ id: oreId, color: o.color, label: o.label, contrib: v });
      any = true;
    }
  }
  for (let i = 0; i < len - 1; i++) dscore[i] = score[i + 1] - score[i];

  let bestY = null, bestVal = 0;
  const tops = [];
  for (let i = 0; i < len; i++) {
    if (score[i] <= 0) continue;
    if (score[i] > bestVal) { bestVal = score[i]; bestY = yMin + i; }
    tops.push({ y: yMin + i, score: score[i] });
  }
  tops.sort((a, b) => b.score - a.score);
  return {
    score, dscore, contributors,
    bestY: any ? bestY : null,
    topK: tops.slice(0, 5),
    yMin, yMax,
  };
}

function computePieSlices(dim, oresById, selected, y, bucketSize) {
  const blocksAtY = (dim.chunksScanned || 0) * 256 * (bucketSize || 1);
  const slices = [];
  let oreSum = 0;
  for (const oreId in selected) {
    const o = oresById[oreId];
    if (!o) continue;
    const idx = y - o.minY;
    const cnt = (idx >= 0 && idx < (o.counts || []).length) ? (o.counts[idx] || 0) : 0;
    oreSum += cnt;
    slices.push({ id: oreId, label: o.label, color: o.color, count: cnt });
  }
  slices.sort((a, b) => b.count - a.count);
  const knownTotal = blocksAtY > 0;
  if (knownTotal) {
    const other = Math.max(0, blocksAtY - oreSum);
    slices.push({ id: "__other__", label: "Other blocks", color: "var(--scroll-thumb)", count: other });
  }
  const total = knownTotal ? blocksAtY : (oreSum || 1);
  let cursor = -Math.PI / 2;
  for (const s of slices) {
    s.frac = s.count / total;
    const angle = s.frac * Math.PI * 2;
    s.start = cursor;
    s.end = cursor + angle;
    cursor = s.end;
  }
  return { slices, blocksAtY, oreSum, total, knownTotal };
}

function loadStoredData() {
  try {
    const raw = sessionStorage.getItem("oresource-data");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.dimensions) return null;
    return parsed;
  } catch (e) { return null; }
}

function applyPackMeta(data, pack) {
  return {
    ...data,
    meta: {
      ...(data.meta || {}),
      modpack: pack.name,
      modpackId: pack.id,
      statsDate: pack.statsDate,
    },
  };
}

function setMeta(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute("content", value);
}

function applyDocumentMeta(pack) {
  const title = pack.name + " - World Generation Splicer ore stats";
  const description = pack.description || "Hosted OreSource export for " + pack.name + ". Interactive ore distribution viewer.";
  const url = window.location.href;
  const image = pack.image ? new URL(pack.image, window.location.href).href : null;
  document.title = title;
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[property="og:url"]', url);
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', description);
  if (image) {
    setMeta('meta[property="og:image"]', image);
    setMeta('meta[name="twitter:image"]', image);
  }
}

async function loadLinkedPack(packId) {
  const manifestRes = await fetch("modpacks/index.json", { cache: "no-store" });
  if (!manifestRes.ok) throw new Error("Could not load modpack list");
  const manifest = await manifestRes.json();
  const packs = Array.isArray(manifest.modpacks) ? manifest.modpacks : [];
  const pack = packs.find(p => p.id === packId);
  if (!pack) throw new Error("Unknown modpack link");
  applyDocumentMeta(pack);
  const dataRes = await fetch(pack.dataPath, { cache: "no-store" });
  if (!dataRes.ok) throw new Error("Could not load " + pack.name + " stats");
  return applyPackMeta(await dataRes.json(), pack);
}

function loadAppData() {
  const fixedPack = typeof window !== "undefined" && window.__ORESOURCE_PACK__;
  if (fixedPack) return loadLinkedPack(fixedPack);
  const params = new URLSearchParams(window.location.search);
  const packId = params.get("pack");
  if (packId) return loadLinkedPack(packId);
  return Promise.resolve(loadStoredData());
}

const GRAPH_SHORT = { density: "d", distribution: "x", range: "r", optimize: "o" };
const GRAPH_LONG = { d: "density", x: "distribution", r: "range", o: "optimize" };
const MODE_SHORT = { percentage: "p", normalized: "n" };
const MODE_LONG = { p: "percentage", n: "normalized" };
const SCORE_SHORT = { percentage: "p", "per-chunk": "c" };
const SCORE_LONG = { p: "percentage", c: "per-chunk" };

function readHashParams() {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.hash.replace(/^#/, ""));
}

function decodeHidden(str) {
  if (!str) return {};
  const out = {};
  for (const id of str.split(",")) {
    if (id) out[id] = true;
  }
  return out;
}

function decodeSelected(str) {
  if (!str) return {};
  const out = {};
  for (const part of str.split(",")) {
    if (!part) continue;
    const idx = part.lastIndexOf(":");
    if (idx <= 0) continue;
    const id = part.slice(0, idx);
    const w = parseFloat(part.slice(idx + 1));
    if (id && Number.isFinite(w)) out[id] = w;
  }
  return out;
}

function encodeViewState(s, dimIds, oresById) {
  const p = new URLSearchParams();
  if (s.dimId && dimIds.includes(s.dimId) && s.dimId !== dimIds[0]) p.set("d", s.dimId);
  if (s.graphStyle && s.graphStyle !== "density") p.set("g", GRAPH_SHORT[s.graphStyle] || s.graphStyle);
  if (s.mode && s.mode !== "percentage") p.set("m", MODE_SHORT[s.mode] || s.mode);
  if (s.merged) p.set("mg", "1");
  if (s.scoreMode && s.scoreMode !== "percentage") p.set("sm", SCORE_SHORT[s.scoreMode] || s.scoreMode);
  if (s.showDeriv) p.set("sd", "1");
  if (s.pieY != null) p.set("py", String(s.pieY));
  if (s.solo && oresById[s.solo]) p.set("s", s.solo);
  const hiddenIds = Object.keys(s.hidden || {}).filter(id => s.hidden[id] && oresById[id]);
  if (hiddenIds.length) p.set("h", hiddenIds.join(","));
  const selEntries = Object.entries(s.selected || {}).filter(([id]) => oresById[id]);
  if (selEntries.length) p.set("w", selEntries.map(([id, w]) => `${id}:${w}`).join(","));
  if (s.oreSearch) p.set("q", s.oreSearch);
  return p;
}

function loadDifferent() {
  sessionStorage.removeItem("oresource-data");
  window.location.href = "index.html";
}

function App() {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  useEffect(() => {
    let alive = true;
    loadAppData()
      .then((data) => {
        if (!alive) return;
        if (!data) {
          window.location.replace("index.html");
          return;
        }
        setState({ data, loading: false, error: null });
      })
      .catch((e) => {
        if (alive) setState({ data: null, loading: false, error: e.message });
      });
    return () => { alive = false; };
  }, []);
  if (state.loading) return <ShellMessage title="Loading stats" text="Fetching ore data..." />;
  if (state.error) return <ShellMessage title="Could not open stats" text={state.error} showButton={true} />;
  return <Viewer data={state.data} />;
}

function ShellMessage({ title, text, showButton }) {
  return (
    <div className="page">
      <header className="hero" role="banner">
        <div className="hero-brand">
          <LogoMark />
          <div className="hero-title">
            <div className="hero-name">OreSource</div>
            <div className="hero-tag">Quarries and more · ore analytics</div>
          </div>
        </div>
        <div className="hero-actions">
          <ThemeToggle />
        </div>
      </header>
      <div className="card"><div className="empty">{title}<br /><span className="fmono">{text}</span>{showButton && <div className="shell-action"><button className="btn primary" onClick={loadDifferent}>Back to data loader</button></div>}</div></div>
    </div>
  );
}

function Viewer({ data }) {
  if (!data.meta) data.meta = { modVersion: "?", mcVersion: "?", loader: "NeoForge" };
  const dimIds = Object.keys(data.dimensions);
  const hashParams = useMemo(() => readHashParams(), []);
  const initialDim = (() => {
    const d = hashParams.get("d");
    return d && dimIds.includes(d) ? d : dimIds[0];
  })();
  const [dimId, setDimId] = useState(initialDim);
  const [mode, setMode] = useState(() => MODE_LONG[hashParams.get("m")] || "percentage");
  const [graphStyle, setGraphStyle] = useState(() => GRAPH_LONG[hashParams.get("g")] || "density");
  const [merged, setMerged] = useState(() => hashParams.get("mg") === "1");
  const dim = data.dimensions[dimId];
  const baseOres = useMemo(() => visibleOreData(dim, (dim.ores || []).map(ensureOreFields)), [dim]);
  const ores = useMemo(() => merged ? mergeOreVariants(baseOres) : baseOres, [baseOres, merged]);
  const oresById = useMemo(() => Object.fromEntries(ores.map(o => [o.id, o])), [ores]);

  const [hidden, setHidden] = useState(() => decodeHidden(hashParams.get("h")));
  const [solo, setSolo] = useState(() => hashParams.get("s") || null);
  const [selected, setSelected] = useState(() => decodeSelected(hashParams.get("w")));
  const [scoreMode, setScoreMode] = useState(() => SCORE_LONG[hashParams.get("sm")] || "percentage");
  const [pieY, setPieY] = useState(() => {
    const v = hashParams.get("py");
    if (v == null) return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  });
  const [showDeriv, setShowDeriv] = useState(() => hashParams.get("sd") === "1");
  const [oreSearch, setOreSearch] = useState(() => hashParams.get("q") || "");
  const dimMergeMounted = useRef(false);
  useEffect(() => {
    if (!dimMergeMounted.current) { dimMergeMounted.current = true; return; }
    setHidden({}); setSolo(null);
    setSelected({}); setPieY(null); setOreSearch("");
  }, [dimId, merged]);

  useEffect(() => {
    const params = encodeViewState(
      { dimId, mode, graphStyle, merged, hidden, solo, selected, scoreMode, pieY, showDeriv, oreSearch },
      dimIds, oresById
    );
    const qs = params.toString();
    const next = `${window.location.pathname}${window.location.search}${qs ? "#" + qs : ""}`;
    window.history.replaceState(null, "", next);
  }, [dimId, mode, graphStyle, merged, hidden, solo, selected, scoreMode, pieY, showDeriv, oreSearch]);

  const packId = useMemo(() => new URLSearchParams(window.location.search).get("pack"), []);
  const [copied, setCopied] = useState(false);
  const shareLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link:", url);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bucketSize = (data.meta && data.meta.bucketSize) || 1;
  const scoreSeries = useMemo(
    () => computeScoreSeries(dim, ores, selected, scoreMode, bucketSize),
    [dim, ores, selected, scoreMode, bucketSize]
  );
  const bestY = scoreSeries.bestY;
  const activePieY = pieY != null ? pieY : (bestY != null ? bestY : dim.minY);
  const pieData = useMemo(
    () => computePieSlices(dim, oresById, selected, activePieY, bucketSize),
    [dim, oresById, selected, activePieY, bucketSize]
  );

  const densityRef = useRef(null);
  const distRef = useRef(null);
  const rangeRef = useRef(null);
  const optimizeRef = useRef(null);

  const toggleHide = (id) => setHidden(h => ({ ...h, [id]: !h[id] }));
  const doSolo = (id) => setSolo(s => (s === id ? null : id));

  const densityCsv = () => {
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
  const distCsv = () => {
    const rows = [["y_level", ...ores.map(o => o.id)]];
    for (let y = dim.minY; y <= dim.maxY; y++) {
      rows.push([y, ...ores.map(o => {
        const idx = y - o.minY;
        return (idx >= 0 && idx < o.counts.length) ? o.counts[idx].toFixed(2) : "";
      })]);
    }
    exportCsv(rows, `${dimId}_distribution.csv`);
  };
  const rangeCsv = () => {
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
  const optimizeCsv = () => {
    const ids = Object.keys(selected);
    const headers = ["y_level", "score", "dscore", ...ids.map(id => `${id}:contrib`)];
    const rows = [headers];
    const chunks = Math.max(1, dim.chunksScanned || 1);
    const blocksAtY = chunks * 256 * (bucketSize || 1);
    const denom = scoreMode === "percentage" ? blocksAtY : chunks;
    for (let y = dim.minY; y <= dim.maxY; y++) {
      const i = y - dim.minY;
      const row = [
        y,
        scoreSeries.score[i].toFixed(6),
        scoreSeries.dscore[i].toFixed(6),
      ];
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

  return (
    <div className="page">
      <header className="hero" role="banner">
        <div className="hero-brand">
          <LogoMark />
          <div className="hero-title">
            <div className="hero-name">OreSource</div>
            <div className="hero-tag">Quarries and more · ore analytics for {data.meta.modpack || `${data.meta.loader} ${data.meta.mcVersion}`}</div>
          </div>
        </div>
        <div className="hero-actions">
          {data.meta.modpack && <span className="version-badge">{data.meta.modpack}</span>}
          <span className="version-badge">v{data.meta.modVersion}</span>
          <button className="btn" onClick={loadDifferent} title="Return to upload page">Load different data</button>
          <button
            className="btn"
            onClick={shareLink}
            disabled={!packId}
            title={packId
              ? "Copy a link that opens this exact view"
              : "Sharing only works for built-in modpack views — custom uploaded data isn't on the web"}
          >
            {copied ? "Copied!" : "Share view"}
          </button>
          <ThemeToggle />
          <a className="btn primary" href="https://github.com/Almana-mc/World-Generation-Splicer-Webpage" target="_blank" rel="noopener noreferrer">
            <GithubIcon /> View on GitHub
          </a>
        </div>
      </header>

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
            <button role="tab" aria-selected={graphStyle === "density"}
              className={graphStyle === "density" ? "on" : ""}
              onClick={() => setGraphStyle("density")}>Density</button>
            <button role="tab" aria-selected={graphStyle === "distribution"}
              className={graphStyle === "distribution" ? "on" : ""}
              onClick={() => setGraphStyle("distribution")}>Distribution</button>
            <button role="tab" aria-selected={graphStyle === "range"}
              className={graphStyle === "range" ? "on" : ""}
              onClick={() => setGraphStyle("range")}>Spawn Range</button>
            <button role="tab" aria-selected={graphStyle === "optimize"}
              className={graphStyle === "optimize" ? "on" : ""}
              onClick={() => setGraphStyle("optimize")}>Optimize</button>
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
        <div className="dim-meta">{dim.id} · y range: {dim.minY} → {dim.maxY} · {ores.length} ore{ores.length === 1 ? "" : "s"}</div>
      </section>

      {!ores.length ? (
        <div className="card"><div className="empty">This dimension has no ore data — the mod found nothing to chart.</div></div>
      ) : (
        <section className="single">
          {graphStyle === "density" && (
          <article className="card" ref={densityRef}>
            <header className="card-head">
              <div>
                <div className="card-title">Ore Density Graph</div>
                <div className="card-sub">One curve per ore — X is Y Level, Y is density. Scroll to zoom, drag to pan, double-click to reset. Solo one ore to see values.</div>
              </div>
              <div className="card-actions">
                <div className="mode-toggle" role="tablist" aria-label="Density mode">
                  <button className={mode === "percentage" ? "on" : ""} onClick={() => setMode("percentage")}>Percentage</button>
                  <button className={mode === "normalized" ? "on" : ""} onClick={() => setMode("normalized")}>Normalized</button>
                </div>
                <button className="mini-btn" onClick={() => exportSvgPng(densityRef.current.querySelector("svg.card-svg"), `${dimId}_density.png`)}>
                  <DownloadIcon /> PNG
                </button>
                <button className="mini-btn" onClick={densityCsv}><DownloadIcon /> CSV</button>
              </div>
            </header>
            <div className="card-body">
              <DensityLine ores={ores} hidden={hidden} solo={solo} onClick={doSolo} mode={mode} dim={dim} />
            </div>
            <Legend ores={ores} hidden={hidden} solo={solo} onToggle={toggleHide} onSolo={doSolo} />
          </article>
          )}
          {graphStyle === "distribution" && (
          <article className="card" ref={distRef}>
            <header className="card-head">
              <div>
                <div className="card-title">Ore Distribution Graph</div>
                <div className="card-sub">One column per ore. Bulge width = normalized spawn rate at each Y level. Scroll wheel zooms Y-axis. Drag left/right to scroll columns. Double-click to reset.</div>
              </div>
              <div className="card-actions">
                <button className="mini-btn" onClick={() => exportSvgPng(distRef.current.querySelector("svg.card-svg"), `${dimId}_distribution.png`)}>
                  <DownloadIcon /> PNG
                </button>
                <button className="mini-btn" onClick={distCsv}><DownloadIcon /> CSV</button>
              </div>
            </header>
            <div className="card-body">
              <DistributionViolin ores={ores} hidden={hidden} solo={solo} onClick={doSolo} dim={dim} />
            </div>
            <Legend ores={ores} hidden={hidden} solo={solo} onToggle={toggleHide} onSolo={doSolo} />
          </article>
          )}
          {graphStyle === "range" && (
          <article className="card" ref={rangeRef}>
            <header className="card-head">
              <div>
                <div className="card-title">Ore Spawn Range Graph</div>
                <div className="card-sub">One bar per ore showing min and max Y. Disjoint outlier ranges render as dots. Scroll wheel zooms Y-axis. Drag left/right to scroll columns. Double-click to reset.</div>
              </div>
              <div className="card-actions">
                <button className="mini-btn" onClick={() => exportSvgPng(rangeRef.current.querySelector("svg.card-svg"), `${dimId}_range.png`)}>
                  <DownloadIcon /> PNG
                </button>
                <button className="mini-btn" onClick={rangeCsv}><DownloadIcon /> CSV</button>
              </div>
            </header>
            <div className="card-body">
              <SpawnRangeBar ores={ores} hidden={hidden} solo={solo} onClick={doSolo} dim={dim} />
            </div>
            <Legend ores={ores} hidden={hidden} solo={solo} onToggle={toggleHide} onSolo={doSolo} />
          </article>
          )}
          {graphStyle === "optimize" && (
          <article className="card opt-card" ref={optimizeRef}>
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
                  <button className={scoreMode === "percentage" ? "on" : ""} onClick={() => setScoreMode("percentage")}>Percentage</button>
                  <button className={scoreMode === "count" ? "on" : ""} onClick={() => setScoreMode("count")}>Count / chunk</button>
                </div>
                <button className={"mini-btn " + (showDeriv ? "on" : "")} onClick={() => setShowDeriv(d => !d)} title="Toggle d/dY overlay">d/dY</button>
                <button className="mini-btn" onClick={() => exportSvgPng(optimizeRef.current && optimizeRef.current.querySelector("svg.card-svg"), `${dimId}_optimize.png`)}>
                  <DownloadIcon /> PNG
                </button>
                <button className="mini-btn" onClick={optimizeCsv}><DownloadIcon /> CSV</button>
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
                        : t.score.toFixed(t.score < 0.01 ? 4 : t.score < 1 ? 3 : t.score < 10 ? 2 : 1);
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
          )}
        </section>
      )}

      <footer className="footer" role="contentinfo">
        <div>
          <strong style={{ color: "var(--ink)" }}>OreSource</strong>
          <span className="fmono" style={{ marginLeft: 10 }}>— Quarries and more</span>
        </div>
        <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <span className="pill">MC {data.meta.mcVersion}</span>
          <span className="pill">{data.meta.loader}</span>
          <span className="pill">v{data.meta.modVersion}</span>
          {data.meta.statsDate && <span className="pill">Stats {data.meta.statsDate}</span>}
        </div>
        <div>
          <a href="https://github.com/Almana-mc/World-Generation-Splicer-Webpage" target="_blank" rel="noopener noreferrer">
            <GithubIcon /> github.com/Almana-mc/World-Generation-Splicer-Webpage
          </a>
        </div>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

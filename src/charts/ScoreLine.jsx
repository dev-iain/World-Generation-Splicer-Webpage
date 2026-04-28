import { memo, useEffect, useRef, useState } from "react";
import { niceStep, useViewport, clampView, chartKeyHandler, safeId } from "../lib/chart-math";
import { escapeHtml, safeColor } from "../lib/colors";
import { showTip, hideTip } from "../lib/tooltip";

function ScoreLine({ dim, scoreSeries, scoreMode, showDeriv, pieY, onPickY }) {
  const ref = useRef(null);
  const tipRef = useRef(null);
  const dragRef = useRef(null);
  const movedRef = useRef(false);
  const rafRef = useRef(0);
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
  }, [viewMin, viewMax, dataMinY, dataMaxY, plotW, pad.left, setView]);

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
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setView(clampView(mn - dx * u, mx - dx * u, dataMinY, dataMaxY, 4));
    });
  };
  useEffect(() => {
    const up = () => { dragRef.current = null; };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
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
    <div ref={ref} tabIndex={0} role="group"
      aria-label="Y-level optimizer chart, arrow keys pan, plus minus zoom, Home reset"
      aria-keyshortcuts="ArrowLeft ArrowRight + - Home"
      onKeyDown={chartKeyHandler(setView, viewMin, viewMax, dataMinY, dataMaxY)}
      style={{ width: "100%", position: "relative" }}>
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
              `<div class="t-y" style="margin-top:2px">score: <b style="color:var(--ink)">${escapeHtml(fmtScore(sVal))}</b>${showDeriv ? ` &nbsp;d/dY: <b style="color:var(--danger)">${escapeHtml(fmtScore(dVal))}</b>` : ""}</div>` +
              (rows.length
                ? rows.map(r => `<div class="t-head" style="margin-top:4px"><span class="t-sw" style="background:${safeColor(r.color)}"></span><span class="t-lbl">${escapeHtml(r.label)}</span><span class="t-n" style="margin-left:auto">${escapeHtml(fmtScore(r.contrib))}</span></div>`).join("")
                : `<div class="t-y" style="margin-top:4px">no contributors at this Y</div>`);
            const aria = `Y ${yVal}, score ${fmtScore(sVal)}${rows.length ? `, top contributor ${rows[0].label}` : ""}`;
            showTip(tipRef, e, ref.current, html, aria);
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
      <div ref={tipRef} className="tip" role="status" aria-live="polite" aria-atomic="true"/>
    </div>
  );
}

export default memo(ScoreLine);

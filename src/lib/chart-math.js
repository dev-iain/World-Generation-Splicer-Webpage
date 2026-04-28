import { useState, useEffect } from "react";

export function niceStep(range) {
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

export function fmtDensity(v, mode) {
  if (mode === "normalized") return v.toFixed(2);
  const p = v * 100;
  if (p >= 10) return p.toFixed(0) + "%";
  if (p >= 1) return p.toFixed(1) + "%";
  return p.toFixed(2) + "%";
}

export function safeId(s) {
  return String(s).replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function trimNs(s) {
  return String(s).replace(/^minecraft:/, "");
}

export function useViewport(dataMin, dataMax, resetKey) {
  const [view, setView] = useState([dataMin, dataMax]);
  useEffect(() => { setView([dataMin, dataMax]); }, [dataMin, dataMax, resetKey]);
  return [view, setView];
}

export function clampView(newMin, newMax, dataMin, dataMax, minRange) {
  let span = Math.max(minRange, newMax - newMin);
  if (span > dataMax - dataMin) span = dataMax - dataMin;
  if (newMin < dataMin) { newMin = dataMin; newMax = newMin + span; }
  if (newMax > dataMax) { newMax = dataMax; newMin = newMax - span; }
  if (newMin < dataMin) newMin = dataMin;
  return [newMin, newMax];
}

export function chartKeyHandler(setView, vMin, vMax, dataMin, dataMax) {
  return (e) => {
    const span = vMax - vMin;
    const step = Math.max(1, Math.round(span * 0.1));
    if (e.key === "ArrowLeft") setView(clampView(vMin - step, vMax - step, dataMin, dataMax, 1));
    else if (e.key === "ArrowRight") setView(clampView(vMin + step, vMax + step, dataMin, dataMax, 1));
    else if (e.key === "+" || e.key === "=") {
      const c = (vMin + vMax) / 2, s = span * 0.45;
      setView(clampView(c - s, c + s, dataMin, dataMax, 1));
    } else if (e.key === "-" || e.key === "_") {
      const c = (vMin + vMax) / 2, s = span * 0.55;
      setView(clampView(c - s, c + s, dataMin, dataMax, 1));
    } else if (e.key === "Home" || e.key === "0") setView([dataMin, dataMax]);
    else return;
    e.preventDefault();
  };
}

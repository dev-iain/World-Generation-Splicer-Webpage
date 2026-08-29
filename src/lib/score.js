export function computeScoreSeries(dim, ores, selected, scoreMode, bucketSize) {
  const yMin = dim.minY, yMax = dim.maxY;
  const len = Math.max(1, yMax - yMin + 1);
  const score = new Array(len).fill(0);
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
  let bestY = null, bestVal = 0;
  const tops = [];
  for (let i = 0; i < len; i++) {
    if (score[i] <= 0) continue;
    if (score[i] > bestVal) { bestVal = score[i]; bestY = yMin + i; }
    tops.push({ y: yMin + i, score: score[i] });
  }
  tops.sort((a, b) => b.score - a.score);
  return {
    score, contributors,
    bestY: any ? bestY : null,
    topK: tops.slice(0, 5),
    yMin, yMax,
  };
}

// Treat the score curve as a mass distribution over Y and describe the
// candidate Y-bands an automatic miner could target. "yield" is ore per
// block excavated, normalised so that mining the whole spawn range == 1.
export function computeMineRanges(scoreSeries, scoreMode) {
  const { score, yMin } = scoreSeries;
  const len = score.length;

  let total = 0, firstY = null, lastY = null, peak = 0, peakY = null;
  for (let i = 0; i < len; i++) {
    const v = score[i];
    if (v <= 0) continue;
    total += v;
    if (firstY == null) firstY = yMin + i;
    lastY = yMin + i;
    if (v > peak) { peak = v; peakY = yMin + i; }
  }
  if (!total || firstY == null) return null;

  const fullHeight = lastY - firstY + 1;
  const fullAvg = total / fullHeight;

  let meanY = 0;
  for (let i = 0; i < len; i++) meanY += (yMin + i) * score[i];
  meanY /= total;
  let varY = 0;
  for (let i = 0; i < len; i++) {
    const d = (yMin + i) - meanY;
    varY += d * d * score[i];
  }
  const sigma = Math.sqrt(varY / total);

  const clampY = (y) => Math.max(firstY, Math.min(lastY, y));
  const bandStats = (lo, hi, key, label) => {
    lo = clampY(lo); hi = clampY(hi);
    if (hi < lo) hi = lo;
    let sum = 0;
    for (let y = lo; y <= hi; y++) {
      const i = y - yMin;
      if (i >= 0 && i < len && score[i] > 0) sum += score[i];
    }
    const height = hi - lo + 1;
    const avg = sum / height;
    return {
      key, label, lo, hi, height,
      captured: sum / total,            // share of the deposit inside the band
      avgDensity: avg,                  // mean score per Y level in the band
      yield: fullAvg > 0 ? avg / fullAvg : 1,   // ore per excavated block vs full range
      chunkMultiple: height > 0 ? fullHeight / height : 1, // extra chunks for equal dig volume
      isPercentage: scoreMode === "percentage",
    };
  };

  // Dense core: widest contiguous run around the peak that stays >= 50% of peak.
  const thr = peak * 0.5;
  let coreLo = peakY, coreHi = peakY;
  for (let y = peakY; y >= firstY; y--) {
    const i = y - yMin;
    if (i < 0 || i >= len || score[i] < thr) break;
    coreLo = y;
  }
  for (let y = peakY; y <= lastY; y++) {
    const i = y - yMin;
    if (i < 0 || i >= len || score[i] < thr) break;
    coreHi = y;
  }

  const bands = [
    bandStats(coreLo, coreHi, "core", "Dense core (>=50% of peak)"),
    bandStats(Math.round(meanY - sigma), Math.round(meanY + sigma), "s1", "+/-1 sigma"),
    bandStats(Math.round(meanY - 2 * sigma), Math.round(meanY + 2 * sigma), "s2", "+/-2 sigma"),
    bandStats(firstY, lastY, "full", "Full spawn range"),
  ];

  return { meanY, sigma, peak, peakY, firstY, lastY, fullHeight, fullAvg, bands };
}

export function computePieSlices(dim, oresById, selected, y, bucketSize) {
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

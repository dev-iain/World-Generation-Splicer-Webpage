export function computeScoreSeries(dim, ores, selected, scoreMode, bucketSize) {
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

export function oreTotal(o) {
  if (typeof o.totalCount === "number") return o.totalCount;
  return (o.counts || []).reduce((sum, count) => sum + (count || 0), 0);
}

export function isOverworldDimension(dimId) {
  return dimId === "minecraft:overworld" || dimId === "overworld";
}

export function isNetherOreId(id) {
  const value = String(id);
  return value.includes("nether") && value.includes("ore");
}

export function isSparseOre(o, chunksScanned) {
  if (!chunksScanned) return false;
  const limit = Math.max(8, chunksScanned * 0.01);
  return oreTotal(o) < limit;
}

export function visibleOreData(dim, ores) {
  if (!isOverworldDimension(dim.id)) return ores;
  return ores.filter(o => !isNetherOreId(o.id) && !isSparseOre(o, dim.chunksScanned || 0));
}

export function spawnRangeText(o) {
  return o.minY === o.maxY ? `${o.minY}` : `${o.minY} to ${o.maxY}`;
}

export function maxObservedSpawnY(ores, fallback) {
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

export function ensureOreFields(o) {
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

export const ORE_MODIFIER_TOKENS = new Set([
  "deepslate", "nether", "end", "blackstone", "tuff", "granite", "diorite",
  "andesite", "calcite", "basalt", "sandstone", "raw", "dense", "poor",
  "rich", "small", "large", "tiny", "ore", "ores",
]);

export function extractOreBase(path) {
  const tokens = path.split("_").filter(Boolean);
  const core = tokens.filter(t => !ORE_MODIFIER_TOKENS.has(t));
  return (core.length ? core : tokens).join("_");
}

export function mergeOreVariants(ores) {
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

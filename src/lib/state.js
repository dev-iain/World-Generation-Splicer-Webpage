export const GRAPH_SHORT = { density: "d", distribution: "x", range: "r", optimize: "o" };
export const GRAPH_LONG = { d: "density", x: "distribution", r: "range", o: "optimize" };
export const MODE_SHORT = { percentage: "p", normalized: "n" };
export const MODE_LONG = { p: "percentage", n: "normalized" };
export const SCORE_SHORT = { percentage: "p", "per-chunk": "c" };
export const SCORE_LONG = { p: "percentage", c: "per-chunk" };

export function readHashParams() {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.hash.replace(/^#/, ""));
}

export function decodeHidden(str) {
  if (!str) return {};
  const out = {};
  for (const id of str.split(",")) {
    if (id) out[id] = true;
  }
  return out;
}

export function decodeSelected(str) {
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

export function encodeViewState(s, dimIds, oresById) {
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

export function loadStoredData() {
  try {
    const raw = sessionStorage.getItem("oresource-data");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.dimensions) return null;
    return parsed;
  } catch (e) { return null; }
}

export function applyPackMeta(data, pack) {
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

export function applyDocumentMeta(pack) {
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

export async function loadLinkedPack(packId) {
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

export function loadAppData() {
  const fixedPack = typeof window !== "undefined" && window.__ORESOURCE_PACK__;
  if (fixedPack) return loadLinkedPack(fixedPack);
  const params = new URLSearchParams(window.location.search);
  const packId = params.get("pack");
  if (packId) return loadLinkedPack(packId);
  return Promise.resolve(loadStoredData());
}

export function loadDifferent() {
  sessionStorage.removeItem("oresource-data");
  window.location.href = "index.html";
}

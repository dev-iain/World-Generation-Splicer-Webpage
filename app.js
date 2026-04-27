(function () {
  const err = document.getElementById("err");
  const drop = document.getElementById("drop");
  const file = document.getElementById("file");
  const paste = document.getElementById("paste");
  const loadBtn = document.getElementById("load");
  const clearBtn = document.getElementById("clear");
  const sampleBtn = document.getElementById("sample");
  const modpackList = document.getElementById("modpack-list");

  function showError(msg) {
    err.textContent = msg;
    err.style.display = "block";
    err.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  function clearError() { err.style.display = "none"; err.textContent = ""; }

  function validate(data) {
    if (!data || typeof data !== "object") return "not a JSON object";
    if (!data.dimensions || typeof data.dimensions !== "object") return "missing 'dimensions' object";
    const keys = Object.keys(data.dimensions);
    if (!keys.length) return "'dimensions' is empty";
    let anyOres = false;
    for (const k of keys) {
      const d = data.dimensions[k];
      if (!d || typeof d !== "object") return "dimension '" + k + "' is not an object";
      if (!Array.isArray(d.ores)) return "dimension '" + k + "' missing 'ores' array";
      if (typeof d.minY !== "number" || typeof d.maxY !== "number") return "dimension '" + k + "' missing numeric minY/maxY";
      if (d.ores.length) anyOres = true;
    }
    if (!anyOres) return "no ores in any dimension - export may have completed before any chunks were scanned";
    return null;
  }

  function accept(data) {
    const problem = validate(data);
    if (problem) { showError("Invalid data: " + problem); return; }
    try {
      sessionStorage.setItem("oresource-data", JSON.stringify(data));
    } catch (e) {
      showError("Could not store data in sessionStorage: " + e.message);
      return;
    }
    window.location.href = "showcase.html";
  }

  function featuredLink(pack) {
    const card = document.createElement("article");
    card.className = "modpack-card";
    const title = document.createElement("div");
    title.className = "modpack-title";
    title.textContent = pack.name;
    const meta = document.createElement("div");
    meta.className = "modpack-meta";
    meta.textContent = [pack.minecraftVersion, pack.loader, pack.statsDate].filter(Boolean).join(" · ");
    const desc = document.createElement("p");
    desc.textContent = pack.description || "";
    const action = document.createElement("a");
    action.className = "btn primary";
    action.href = "showcase.html?pack=" + encodeURIComponent(pack.id);
    action.textContent = "Open stats";
    card.append(title, meta, desc, action);
    return card;
  }

  async function loadFeaturedModpacks() {
    if (!modpackList) return;
    try {
      const res = await fetch("modpacks/index.json", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const manifest = await res.json();
      const packs = Array.isArray(manifest.modpacks) ? manifest.modpacks : [];
      modpackList.replaceChildren(...packs.map(featuredLink));
      if (!packs.length) modpackList.closest(".featured-panel").style.display = "none";
    } catch (e) {
      modpackList.closest(".featured-panel").style.display = "none";
    }
  }

  function parseAndAccept(text) {
    clearError();
    let parsed;
    try { parsed = JSON.parse(text); }
    catch (e) { showError("JSON parse error: " + e.message); return; }
    accept(parsed);
  }

  function readFile(f) {
    if (!f) return;
    if (f.size > 64 * 1024 * 1024) { showError("File larger than 64 MB - refusing to load"); return; }
    const reader = new FileReader();
    reader.onload = (e) => parseAndAccept(String(e.target.result));
    reader.onerror = () => showError("Could not read file");
    reader.readAsText(f);
  }

  drop.addEventListener("click", () => file.click());
  drop.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); file.click(); }
  });
  file.addEventListener("change", (e) => readFile(e.target.files && e.target.files[0]));

  ["dragenter", "dragover"].forEach((ev) => {
    drop.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); drop.classList.add("over"); });
  });
  ["dragleave", "drop"].forEach((ev) => {
    drop.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); drop.classList.remove("over"); });
  });
  drop.addEventListener("drop", (e) => {
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    readFile(f);
  });

  loadBtn.addEventListener("click", () => {
    const t = paste.value.trim();
    if (!t) { showError("Paste some JSON first"); return; }
    parseAndAccept(t);
  });
  clearBtn.addEventListener("click", () => { paste.value = ""; clearError(); });

  sampleBtn.addEventListener("click", async () => {
    clearError();
    try {
      const res = await fetch("sample.json", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      accept(data);
    } catch (e) {
      showError("Could not load sample.json: " + e.message + " (serve docs/ over HTTP, not file://)");
    }
  });

  loadFeaturedModpacks();

  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) themeBtn.addEventListener("click", () => window.__oresourceTheme.toggle());
})();

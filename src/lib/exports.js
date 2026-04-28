export function exportSvgPng(svgEl, filename, bg) {
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

export function exportCsv(rows, filename) {
  const csv = rows.map((r) => r.map((c) => {
    const s = String(c ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function showTip(tipRef, e, container, html, ariaText) {
  const tip = tipRef.current; if (!tip || !container) return;
  tip.innerHTML = html;
  if (ariaText !== undefined) {
    if (tip._ariaTimer) clearTimeout(tip._ariaTimer);
    tip._ariaTimer = setTimeout(() => { if (tip) tip.setAttribute("aria-label", ariaText); }, 250);
  }
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

export function hideTip(tipRef) {
  if (tipRef.current) tipRef.current.style.opacity = 0;
}

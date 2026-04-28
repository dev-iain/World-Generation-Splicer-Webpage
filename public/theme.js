(() => {
  const KEY = "oresource-theme";
  const stored = localStorage.getItem(KEY);
  const prefers = matchMedia("(prefers-color-scheme: dark)").matches;
  const initial = stored || (prefers ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", initial);

  const api = {
    get: () => document.documentElement.getAttribute("data-theme"),
    set: (t) => {
      document.documentElement.setAttribute("data-theme", t);
      localStorage.setItem(KEY, t);
      window.dispatchEvent(new CustomEvent("oresource-theme-change", { detail: { theme: t } }));
    },
    toggle: () => {
      const next = api.get() === "dark" ? "light" : "dark";
      api.set(next);
      return next;
    }
  };
  window.__oresourceTheme = api;
})();

import { GithubIcon } from "./Icons";

export default function ViewerFooter({ meta }) {
  return (
    <footer className="footer" role="contentinfo">
      <div>
        <strong style={{ color: "var(--ink)" }}>OreSource</strong>
        <span className="fmono" style={{ marginLeft: 10 }}>· Quarries and more</span>
      </div>
      <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
        <span className="pill">MC {meta.mcVersion}</span>
        <span className="pill">{meta.loader}</span>
        <span className="pill">v{meta.modVersion}</span>
        {meta.statsDate && <span className="pill">Stats {meta.statsDate}</span>}
      </div>
      <div>
        <a href="https://github.com/Almana-mc/World-Generation-Splicer-Webpage" target="_blank" rel="noopener noreferrer">
          <GithubIcon /> github.com/Almana-mc/World-Generation-Splicer-Webpage
        </a>
      </div>
    </footer>
  );
}

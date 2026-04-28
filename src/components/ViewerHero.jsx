import LogoMark from "./LogoMark";
import ThemeToggle from "./ThemeToggle";
import { GithubIcon } from "./Icons";
import { loadDifferent } from "../lib/state";

export default function ViewerHero({ meta, packId, copied, onShare }) {
  return (
    <header className="hero" role="banner">
      <div className="hero-brand">
        <LogoMark />
        <div className="hero-title">
          <h1 className="hero-name">OreSource</h1>
          <div className="hero-tag">
            Quarries and more · ore analytics for {meta.modpack || `${meta.loader} ${meta.mcVersion}`}
          </div>
        </div>
      </div>
      <div className="hero-actions">
        {meta.modpack && <span className="version-badge">{meta.modpack}</span>}
        <span className="version-badge">v{meta.modVersion}</span>
        <button className="btn" onClick={loadDifferent} title="Return to upload page">Load different data</button>
        <button
          className="btn"
          onClick={onShare}
          disabled={!packId}
          title={packId
            ? "Copy a link that opens this exact view"
            : "Sharing only works for built-in modpack views — custom uploaded data isn't on the web"}
        >
          {copied ? "Copied!" : "Share view"}
        </button>
        <ThemeToggle />
        <a className="btn primary" href="https://github.com/Almana-mc/World-Generation-Splicer-Webpage" target="_blank" rel="noopener noreferrer">
          <GithubIcon /> View on GitHub
        </a>
      </div>
    </header>
  );
}

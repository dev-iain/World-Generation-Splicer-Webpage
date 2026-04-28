import LogoMark from "./LogoMark";
import ThemeToggle from "./ThemeToggle";
import { loadDifferent } from "../lib/state";

export default function ShellMessage({ title, text, showButton }) {
  return (
    <div className="page">
      <header className="hero" role="banner">
        <div className="hero-brand">
          <LogoMark />
          <div className="hero-title">
            <h1 className="hero-name">OreSource</h1>
            <div className="hero-tag">Quarries and more · ore analytics</div>
          </div>
        </div>
        <div className="hero-actions">
          <ThemeToggle />
        </div>
      </header>
      <div className="card">
        <div className="empty">
          {title}<br />
          <span className="fmono">{text}</span>
          {showButton && (
            <div className="shell-action">
              <button className="btn primary" onClick={loadDifferent}>Back to data loader</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

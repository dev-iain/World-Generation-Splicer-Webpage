const ORE_CELL_COLORS = ["#4DD0E1", "#D7CCC8", "#FFD54F", "#FF7043", "#E53935", "#66BB6A", "#1E88E5", "#424242", "#B0BEC5"];

export default function LogoMark() {
  return (
    <div className="logo-mark" aria-hidden="true">
      {ORE_CELL_COLORS.map((c, i) => <span key={i} style={{ background: c }} />)}
    </div>
  );
}

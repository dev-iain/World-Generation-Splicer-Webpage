import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ViewerHero from "./components/ViewerHero";
import ViewerControls from "./components/ViewerControls";
import ViewerFooter from "./components/ViewerFooter";
import DensityCard from "./components/DensityCard";
import DistributionCard from "./components/DistributionCard";
import RangeCard from "./components/RangeCard";
import OptimizerCard from "./components/OptimizerCard";
import { ensureOreFields, mergeOreVariants, visibleOreData } from "./lib/ores";
import { computePieSlices, computeScoreSeries } from "./lib/score";
import {
  GRAPH_LONG, MODE_LONG, SCORE_LONG,
  decodeHidden, decodeSelected, encodeViewState, readHashParams,
} from "./lib/state";

export default function Viewer({ data }) {
  const meta = data.meta || { modVersion: "?", mcVersion: "?", loader: "NeoForge" };
  const dimIds = useMemo(() => Object.keys(data.dimensions), [data.dimensions]);
  const hashParams = useMemo(() => readHashParams(), []);
  const initialDim = (() => {
    const d = hashParams.get("d");
    return d && dimIds.includes(d) ? d : dimIds[0];
  })();

  const [dimId, setDimId] = useState(initialDim);
  const [mode, setMode] = useState(() => MODE_LONG[hashParams.get("m")] || "percentage");
  const [graphStyle, setGraphStyle] = useState(() => GRAPH_LONG[hashParams.get("g")] || "density");
  const [merged, setMerged] = useState(() => hashParams.get("mg") === "1");

  const dim = data.dimensions[dimId];
  const baseOres = useMemo(() => visibleOreData(dim, (dim.ores || []).map(ensureOreFields)), [dim]);
  const ores = useMemo(() => merged ? mergeOreVariants(baseOres) : baseOres, [baseOres, merged]);
  const oresById = useMemo(() => Object.fromEntries(ores.map(o => [o.id, o])), [ores]);

  const [hidden, setHidden] = useState(() => decodeHidden(hashParams.get("h")));
  const [solo, setSolo] = useState(() => hashParams.get("s") || null);
  const [selected, setSelected] = useState(() => decodeSelected(hashParams.get("w")));
  const [scoreMode, setScoreMode] = useState(() => SCORE_LONG[hashParams.get("sm")] || "percentage");
  const [pieY, setPieY] = useState(() => {
    const v = hashParams.get("py");
    if (v == null) return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  });
  const [showDeriv, setShowDeriv] = useState(() => hashParams.get("sd") === "1");
  const [oreSearch, setOreSearch] = useState(() => hashParams.get("q") || "");

  const dimMergeMounted = useRef(false);
  useEffect(() => {
    if (!dimMergeMounted.current) { dimMergeMounted.current = true; return; }
    setHidden({}); setSolo(null);
    setSelected({}); setPieY(null); setOreSearch("");
  }, [dimId, merged]);

  useEffect(() => {
    const params = encodeViewState(
      { dimId, mode, graphStyle, merged, hidden, solo, selected, scoreMode, pieY, showDeriv, oreSearch },
      dimIds, oresById
    );
    const qs = params.toString();
    const next = `${window.location.pathname}${window.location.search}${qs ? "#" + qs : ""}`;
    window.history.replaceState(null, "", next);
  }, [dimId, mode, graphStyle, merged, hidden, solo, selected, scoreMode, pieY, showDeriv, oreSearch, dimIds, oresById]);

  const packId = useMemo(() => new URLSearchParams(window.location.search).get("pack"), []);
  const [copied, setCopied] = useState(false);
  const onShare = useCallback(async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link:", url);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const bucketSize = meta.bucketSize || 1;
  const scoreSeries = useMemo(
    () => computeScoreSeries(dim, ores, selected, scoreMode, bucketSize),
    [dim, ores, selected, scoreMode, bucketSize]
  );
  const bestY = scoreSeries.bestY;
  const activePieY = pieY != null ? pieY : (bestY != null ? bestY : dim.minY);
  const pieData = useMemo(
    () => computePieSlices(dim, oresById, selected, activePieY, bucketSize),
    [dim, oresById, selected, activePieY, bucketSize]
  );

  const toggleHide = useCallback((id) => setHidden(h => ({ ...h, [id]: !h[id] })), []);
  const doSolo = useCallback((id) => setSolo(s => (s === id ? null : id)), []);

  const cardProps = { ores, hidden, solo, doSolo, toggleHide, dim, dimId };

  return (
    <div className="page">
      <ViewerHero meta={meta} packId={packId} copied={copied} onShare={onShare} />
      <ViewerControls
        data={data} dimIds={dimIds} dimId={dimId} setDimId={setDimId}
        graphStyle={graphStyle} setGraphStyle={setGraphStyle}
        merged={merged} setMerged={setMerged}
        dim={dim} oresLength={ores.length}
      />

      {!ores.length ? (
        <div className="card"><div className="empty">This dimension has no ore data — the mod found nothing to chart.</div></div>
      ) : (
        <section className="single">
          {graphStyle === "density"      && <DensityCard      {...cardProps} mode={mode} setMode={setMode} />}
          {graphStyle === "distribution" && <DistributionCard {...cardProps} />}
          {graphStyle === "range"        && <RangeCard        {...cardProps} />}
          {graphStyle === "optimize"     && (
            <OptimizerCard
              ores={ores} oresById={oresById} dim={dim} dimId={dimId}
              selected={selected} setSelected={setSelected}
              scoreMode={scoreMode} setScoreMode={setScoreMode}
              showDeriv={showDeriv} setShowDeriv={setShowDeriv}
              pieY={pieY} setPieY={setPieY}
              oreSearch={oreSearch} setOreSearch={setOreSearch}
              scoreSeries={scoreSeries} pieData={pieData} activePieY={activePieY}
              bestY={bestY} bucketSize={bucketSize}
            />
          )}
        </section>
      )}

      <ViewerFooter meta={meta} />
    </div>
  );
}

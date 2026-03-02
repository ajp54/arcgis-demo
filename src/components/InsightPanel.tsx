import { useEffect, useState, useCallback } from "react";
import { TrendingUp, RefreshCw, BarChart2, DollarSign } from "lucide-react";
import type Layer from "@arcgis/core/layers/Layer";
import {
  joinAreaData,
  calculateAffordabilityScore,
  formatCurrency,
  getAffordabilityRating,
} from "../utils/dataUtils";
import type { AreaData } from "../utils/dataUtils";
import { FIELD_NAMES } from "../config/arcgis";
import "../styles/InsightPanel.css";

/**
 * InsightPanel
 * Queries a sample of features from both layers, joins them by FIPS/name,
 * and displays a Home Value vs Income affordability comparison.
 *
 * Props:
 *   homeValueLayer  ArcGIS FeatureLayer | null
 *   incomeLayer     ArcGIS FeatureLayer | null
 *   mapReady        boolean
 */

type Status = "idle" | "loading" | "ready" | "error";
type SortBy = "affordability" | "value" | "income";

interface InsightPanelProps {
  homeValueLayer: Layer | null;
  incomeLayer: Layer | null;
  mapReady: boolean;
}

// Minimal graphic interface for feature results
interface ArcGISGraphic {
  attributes?: Record<string, unknown>;
}

export default function InsightPanel({ homeValueLayer, incomeLayer, mapReady }: InsightPanelProps) {
  const [status, setStatus] = useState<Status>("idle"); // idle | loading | ready | error
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>("affordability");

  const loadInsights = useCallback(async () => {
    if (!homeValueLayer && !incomeLayer) {
      setStatus("error");
      return;
    }
    setStatus("loading");

    try {
      const [homeValueFeatures, incomeFeatures] = await Promise.all([
        queryLayer(homeValueLayer),
        queryLayer(incomeLayer),
      ]);

      let data: AreaData[] = [];

      if (homeValueFeatures.length && incomeFeatures.length) {
        data = joinAreaData(homeValueFeatures, incomeFeatures, FIELD_NAMES);
      } else if (homeValueFeatures.length) {
        data = homeValueFeatures.map((f) => ({
          name:               String(f.attributes?.[FIELD_NAMES.homeValue.name] ?? "Unknown"),
          medianHomeValue:    (f.attributes?.[FIELD_NAMES.homeValue.value] as number | null) ?? null,
          medianIncome:       null,
          affordabilityScore: null,
          priceToIncomeRatio: null,
        }));
      } else if (incomeFeatures.length) {
        data = incomeFeatures.map((f) => ({
          name:               String(f.attributes?.[FIELD_NAMES.income.name] ?? "Unknown"),
          medianHomeValue:    null,
          medianIncome:       (f.attributes?.[FIELD_NAMES.income.value] as number | null) ?? null,
          affordabilityScore: null,
          priceToIncomeRatio: null,
        }));
      }

      if (!data.length) {
        setStatus("error");
        return;
      }

      // Re-calculate affordability scores in case join didn't have both values
      const enriched: AreaData[] = data.map((d) => ({
        ...d,
        affordabilityScore:
          d.affordabilityScore != null
            ? d.affordabilityScore
            : calculateAffordabilityScore(d.medianHomeValue, d.medianIncome),
      }));

      setAreas(enriched);
      setStatus("ready");
    } catch (err) {
      console.error("InsightPanel query error:", err);
      setStatus("error");
    }
  }, [homeValueLayer, incomeLayer]);

  // Auto-load once map is ready and layers exist
  useEffect(() => {
    if (mapReady && (homeValueLayer || incomeLayer)) {
      loadInsights();
    }
  }, [mapReady, homeValueLayer, incomeLayer, loadInsights]);

  // ── Sorting ─────────────────────────────────────────────────────────────
  const sorted = [...areas].sort((a, b) => {
    if (sortBy === "affordability")
      return (b.affordabilityScore ?? -1) - (a.affordabilityScore ?? -1);
    if (sortBy === "income")
      return (b.medianIncome ?? -1) - (a.medianIncome ?? -1);
    if (sortBy === "value")
      return (a.medianHomeValue ?? Infinity) - (b.medianHomeValue ?? Infinity);
    return 0;
  });

  const top5      = sorted.slice(0, 5);
  const maxValue  = Math.max(...areas.map((d) => d.medianHomeValue ?? 0));
  const maxIncome = Math.max(...areas.map((d) => d.medianIncome    ?? 0));

  const sortTabs: Array<{ key: SortBy; label: string; icon: React.ReactElement }> = [
    { key: "affordability", label: "Affordable",     icon: <BarChart2  size={11} /> },
    { key: "income",        label: "Highest Income", icon: <TrendingUp size={11} /> },
    { key: "value",         label: "Lowest Price",   icon: <DollarSign size={11} /> },
  ];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <section className="insight-panel">
      <div className="panel-header">
        <TrendingUp size={16} className="panel-icon" />
        <span>Home Value vs Income</span>
        {status === "ready" && (
          <button
            className="refresh-btn"
            onClick={loadInsights}
            title="Refresh data"
          >
            <RefreshCw size={13} />
          </button>
        )}
      </div>

      {/* ── Idle ── */}
      {status === "idle" && (
        <div className="insight-status">Waiting for map to load…</div>
      )}

      {/* ── Loading ── */}
      {status === "loading" && (
        <div className="insight-status">
          <span className="spinner" />
          Querying areas…
        </div>
      )}

      {/* ── Error ── */}
      {status === "error" && (
        <div className="insight-error">
          <p>Could not load insight data.</p>
          <p className="insight-error-hint">
            Verify that the layer titles and field names in{" "}
            <code>src/config/arcgis.ts</code> match your Web Map.
          </p>
          <button className="retry-btn" onClick={loadInsights}>
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* ── Data ready ── */}
      {status === "ready" && (
        <>
          {/* Sort controls */}
          <div className="sort-tabs">
            {sortTabs.map(({ key, label, icon }) => (
              <button
                key={key}
                className={`sort-tab ${sortBy === key ? "active" : ""}`}
                onClick={() => setSortBy(key)}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Bar chart */}
          <div className="bar-chart">
            {top5.map((area, i) => {
              const barValue =
                sortBy === "affordability" ? area.affordabilityScore :
                sortBy === "income"        ? area.medianIncome       :
                area.medianHomeValue;

              const barMax =
                sortBy === "affordability" ? 100        :
                sortBy === "income"        ? maxIncome  :
                maxValue;

              const barWidth =
                barValue != null && barMax > 0
                  ? `${Math.round((barValue / barMax) * 100)}%`
                  : "0%";

              const rating =
                area.affordabilityScore != null
                  ? getAffordabilityRating(area.affordabilityScore)
                  : null;

              const barColor =
                sortBy === "value"  ? "var(--color-gold)"   :
                sortBy === "income" ? "var(--color-income)"  :
                rating?.color ?? "var(--color-accent)";

              const displayValue =
                sortBy === "value"  ? formatCurrency(area.medianHomeValue) :
                sortBy === "income" ? formatCurrency(area.medianIncome)    :
                `${area.affordabilityScore ?? "N/A"}/100`;

              return (
                <div key={area.name} className="bar-row">
                  <div className="bar-rank">{i + 1}</div>
                  <div className="bar-content">
                    <div className="bar-label-row">
                      <span className="bar-name">{area.name}</span>
                      <span className="bar-metric" style={{ color: barColor }}>
                        {displayValue}
                      </span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: barWidth, background: barColor }}
                      />
                    </div>
                    <div className="bar-submeta">
                      {sortBy === "affordability" && area.priceToIncomeRatio != null && (
                        <span>{area.priceToIncomeRatio}× income ratio</span>
                      )}
                      {sortBy === "value" && area.medianIncome != null && (
                        <span>Income: {formatCurrency(area.medianIncome)}</span>
                      )}
                      {sortBy === "income" && area.medianHomeValue != null && (
                        <span>Value: {formatCurrency(area.medianHomeValue)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="insight-footer">
            Showing top 5 of {areas.length} areas
          </div>
        </>
      )}
    </section>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function queryLayer(layer: Layer | null): Promise<ArcGISGraphic[]> {
  if (!layer) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const l = layer as any;
  await l.load();
  console.log(`[HomeScope] Querying "${l.title}" (type: ${l.type})`);

  // FeatureLayer — direct query
  if (typeof l.queryFeatures === "function") {
    try {
      const q = l.createQuery();
      q.where = "1=1";
      q.returnGeometry = false;
      q.outFields = ["*"];
      q.num = 100;
      const result = await l.queryFeatures(q);
      console.log(`[HomeScope] Got ${result.features?.length ?? 0} features from "${l.title}"`);
      return result.features ?? [];
    } catch (err) {
      console.error(`[InsightPanel] queryFeatures failed for "${l.title}":`, err);
      return [];
    }
  }

  // MapImageLayer — query the first sublayer instead
  if (l.type === "map-image") {
    const sublayer = l.sublayers?.getItemAt(0);
    if (!sublayer) {
      console.warn(`[InsightPanel] MapImageLayer "${l.title}" has no sublayers`);
      return [];
    }
    try {
      await sublayer.load();
      const q = sublayer.createQuery();
      q.where = "1=1";
      q.returnGeometry = false;
      q.outFields = ["*"];
      q.num = 100;
      const result = await sublayer.queryFeatures(q);
      console.log(`[HomeScope] Got ${result.features?.length ?? 0} features from sublayer "${sublayer.title}"`);
      return result.features ?? [];
    } catch (err) {
      console.error(`[InsightPanel] sublayer queryFeatures failed for "${l.title}":`, err);
      return [];
    }
  }

  console.warn(`[InsightPanel] Unsupported layer type "${l.type}" for "${l.title}"`);
  return [];
}

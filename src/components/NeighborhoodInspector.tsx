import { MapPin, Home, TrendingUp, BarChart2, MousePointer } from "lucide-react";
import { formatCurrency, getAffordabilityRating } from "../utils/dataUtils";
import type { LocationData } from "../utils/dataUtils";
import "./NeighborhoodInspector.css";

/**
 * NeighborhoodInspector
 * Displays data for the area the user clicked.
 *
 * Props:
 *   data  {
 *     areaName:             string,
 *     medianHomeValue:      number | null,
 *     medianIncome:         number | null,
 *     affordabilityScore:   number | null,
 *     priceToIncomeRatio:   number | null,
 *   } | null
 */

interface NeighborhoodInspectorProps {
  data: LocationData | null;
}

export default function NeighborhoodInspector({ data }: NeighborhoodInspectorProps) {
  // Empty state — nothing clicked yet
  if (!data) {
    return (
      <section className="inspector inspector--empty">
        <div className="panel-header">
          <MapPin size={16} className="panel-icon" />
          <span>Area Inspector</span>
        </div>
        <div className="empty-hint">
          <MousePointer size={28} strokeWidth={1.5} className="empty-icon" />
          <p>Click any area on the map to inspect its data.</p>
        </div>
      </section>
    );
  }

  const rating = data.affordabilityScore != null
    ? getAffordabilityRating(data.affordabilityScore)
    : null;
  const scorePercent = data.affordabilityScore ?? 0;

  return (
    <section className="inspector">
      <div className="panel-header">
        <MapPin size={16} className="panel-icon" />
        <span>Area Inspector</span>
      </div>

      {/* Area name */}
      <div className="neighborhood-name">
        <MapPin size={14} style={{ color: "var(--color-accent)", flexShrink: 0 }} />
        <span>{data.areaName}</span>
      </div>

      {/* Metrics grid */}
      <div className="metrics-grid">
        {/* Median Home Value */}
        <div className="metric-card">
          <div className="metric-icon-wrap" style={{ background: "rgba(251,191,36,0.12)" }}>
            <Home size={16} style={{ color: "var(--color-gold)" }} />
          </div>
          <div className="metric-body">
            <div className="metric-label">Median Home Value</div>
            <div className="metric-value" style={{ color: "var(--color-gold)" }}>
              {data.medianHomeValue != null
                ? formatCurrency(data.medianHomeValue)
                : <span className="metric-na">No data</span>}
            </div>
          </div>
        </div>

        {/* Median Income */}
        <div className="metric-card">
          <div className="metric-icon-wrap" style={{ background: "rgba(52,211,153,0.12)" }}>
            <TrendingUp size={16} style={{ color: "var(--color-income)" }} />
          </div>
          <div className="metric-body">
            <div className="metric-label">Median Income</div>
            <div className="metric-value" style={{ color: "var(--color-income)" }}>
              {data.medianIncome != null
                ? formatCurrency(data.medianIncome)
                : <span className="metric-na">No data</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Affordability Score */}
      {data.affordabilityScore != null && rating != null ? (
        <div className="safety-card">
          <div className="safety-header">
            <div className="safety-title-row">
              <BarChart2 size={15} style={{ color: rating.color }} />
              <span className="safety-title">Affordability Score</span>
              {data.priceToIncomeRatio != null && (
                <span className="pir-chip">
                  {data.priceToIncomeRatio}× income
                </span>
              )}
            </div>
            <div className="safety-score-row">
              <span className="safety-score-num" style={{ color: rating.color }}>
                {data.affordabilityScore}
              </span>
              <span className="safety-score-max">/100</span>
              <span
                className="safety-badge"
                style={{
                  background: `${rating.color}22`,
                  color: rating.color,
                  border: `1px solid ${rating.color}44`,
                }}
              >
                {rating.label}
              </span>
            </div>
          </div>

          {/* Score bar */}
          <div className="score-bar-track">
            <div
              className="score-bar-fill"
              style={{ width: `${scorePercent}%`, background: rating.color }}
            />
          </div>
        </div>
      ) : (
        <div className="safety-card safety-na">
          <BarChart2 size={15} style={{ color: "var(--text-muted)" }} />
          <span>Affordability score requires data from both layers.</span>
        </div>
      )}
    </section>
  );
}

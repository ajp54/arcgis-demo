import { useState } from "react";
import { Home, TrendingUp, Layers, X } from "lucide-react";
import "../styles/LayerControls.css";

/**
 * LayerControls
 * Glassmorphism panel on the right side of the map with toggle switches
 * to show / hide the Home Value and Income layers.
 *
 * Props:
 *   layers       { homeValue: boolean, income: boolean }
 *   onToggle     (layerKey: "homeValue" | "income") => void
 *   mapReady     boolean — disables toggles while map is loading
 */

interface LayerVisibility {
  homeValue: boolean;
  income: boolean;
}

type LayerKey = keyof LayerVisibility;

interface LayerControlsProps {
  layers: LayerVisibility;
  onToggle: (key: LayerKey) => void;
  mapReady: boolean;
}

export default function LayerControls({ layers, onToggle, mapReady }: LayerControlsProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`layer-controls-wrapper${mobileOpen ? " mobile-open" : ""}`}>
      {/*
        Wrapper uses flex-direction: column with bottom: 0 anchor.
        FAB (first) sits above the panel (second) and both grow upward together.
      */}
      <button
        className="layer-controls-fab"
        onClick={() => setMobileOpen((o) => !o)}
        aria-label={mobileOpen ? "Close layer controls" : "Open layer controls"}
      >
        {mobileOpen ? <X size={20} /> : <Layers size={20} />}
      </button>

      <aside className="layer-controls">
        {/*
          Inner wrapper holds the padding so the outer aside can truly collapse
          to zero height on mobile (padding would otherwise prevent full collapse).
        */}
        <div className="layer-controls-inner">
          <div className="panel-header">
            <Layers size={16} className="panel-icon" />
            <span>Layer Controls</span>
          </div>

          <div className="layer-list">
            {/* Home Value Toggle */}
            <div className="layer-item">
              <div className="layer-info">
                <span className="layer-dot" style={{ background: "var(--color-gold)" }} />
                <Home size={14} className="layer-icon" />
                <div>
                  <div className="layer-name">Median Home Value</div>
                  <div className="layer-desc">2025 estimate by area</div>
                </div>
              </div>
              <button
                className={`toggle-btn ${layers.homeValue ? "active" : ""}`}
                onClick={() => onToggle("homeValue")}
                disabled={!mapReady}
                aria-label="Toggle median home value layer"
              >
                <span className="toggle-knob" />
              </button>
            </div>

            {/* Income Toggle */}
            <div className="layer-item">
              <div className="layer-info">
                <span className="layer-dot" style={{ background: "var(--color-income)" }} />
                <TrendingUp size={14} className="layer-icon" />
                <div>
                  <div className="layer-name">Median Income</div>
                  <div className="layer-desc">2025 estimate by area</div>
                </div>
              </div>
              <button
                className={`toggle-btn ${layers.income ? "active" : ""}`}
                onClick={() => onToggle("income")}
                disabled={!mapReady}
                aria-label="Toggle median income layer"
              >
                <span className="toggle-knob" />
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="legend">
            <div className="legend-title">Legend</div>

            <div className="legend-gradient-block">
              <div className="legend-gradient-label">Median Home Value</div>
              <div
                className="legend-gradient-bar"
                style={{ background: "linear-gradient(to right, #aa2a20, #ffd6cc, #74397f)" }}
              />
              <div className="legend-gradient-ticks">
                <span>Lowest</span>
                <span>Median</span>
                <span>Highest</span>
              </div>
            </div>

            <div className="legend-gradient-block">
              <div className="legend-gradient-label">Median Income</div>
              <div
                className="legend-gradient-bar"
                style={{ background: "linear-gradient(to right, #a60298, #b3b8b6, #6a8c02)" }}
              />
              <div className="legend-gradient-ticks">
                <span>Lowest</span>
                <span>Median</span>
                <span>Highest</span>
              </div>
            </div>
          </div>

          {!mapReady && (
            <div className="loading-badge">
              <span className="spinner" />
              Loading map…
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

import { useState, useCallback, useEffect, useRef } from "react";
import { MapPin, Activity, AlertCircle, X } from "lucide-react";
import type MapView from "@arcgis/core/views/MapView";
import type Layer from "@arcgis/core/layers/Layer";
import MapComponent from "./components/MapComponent";
import LayerControls from "./components/LayerControls";
// import NeighborhoodInspector from "./components/NeighborhoodInspector";
// import InsightPanel from "./components/InsightPanel";
import type { LocationData } from "./utils/dataUtils";
import "./App.css";

type LayerKey = "homeValue" | "income";

interface LayerVisibility {
  homeValue: boolean;
  income: boolean;
}

export default function App() {
  // ── Map / layer state ────────────────────────────────────────────────────
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const homeValueLayerRef = useRef<Layer | null>(null);
  const incomeLayerRef    = useRef<Layer | null>(null);

  // ── Layer visibility ─────────────────────────────────────────────────────
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
    homeValue: true,
    income:    true,
  });

  // ── Inspector ─────────────────────────────────────────────────────────────
  const [inspectorData, setInspectorData] = useState<LocationData | null>(null);

  // ── Right-panel tab: "inspector" | "insights" ────────────────────────────
  const [activeTab, setActiveTab] = useState<"inspector" | "insights">("inspector");

  // Keep a stable reference to layers for the InsightPanel
  const [layers, setLayers] = useState<{ homeValue: Layer | null; income: Layer | null }>({
    homeValue: null,
    income: null,
  });

  // ── Callbacks ─────────────────────────────────────────────────────────────
  const handleMapReady = useCallback(
    (view: MapView, homeValueLayer: Layer | null, incomeLayer: Layer | null) => {
      homeValueLayerRef.current = homeValueLayer;
      incomeLayerRef.current    = incomeLayer;
      setLayers({ homeValue: homeValueLayer, income: incomeLayer });
      setMapReady(true);
    },
    []
  );

  const handleLocationClick = useCallback((data: LocationData | null) => {
    setInspectorData(data);
    if (data) setActiveTab("inspector");
  }, []);

  const handleError = useCallback((message: string) => {
    setMapError(message);
    setMapReady(true); // still allow the map to render
  }, []);

  // Sync layer visibility to ArcGIS layer objects
  useEffect(() => {
    if (homeValueLayerRef.current) {
      homeValueLayerRef.current.visible = layerVisibility.homeValue;
    }
  }, [layerVisibility.homeValue]);

  useEffect(() => {
    if (incomeLayerRef.current) {
      incomeLayerRef.current.visible = layerVisibility.income;
    }
  }, [layerVisibility.income]);

  const toggleLayer = useCallback((key: LayerKey) => {
    setLayerVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app-root">
      {/* ── Full-screen ArcGIS Map ─────────────────────────────────────── */}
      <MapComponent
        onMapReady={handleMapReady}
        onLocationClick={handleLocationClick}
        onError={handleError}
      />

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="header-brand">
          <div className="header-logo">
            <MapPin size={18} />
          </div>
          <div>
            <div className="header-title">HomeScope</div>
            <div className="header-subtitle">Home Value &amp; Income Explorer</div>
          </div>
        </div>

        <div className="header-center">
          <div className="header-chip">
            <Activity size={12} />
            <span>ArcGIS Live Data</span>
          </div>
          {!mapReady && (
            <div className="header-chip header-chip--loading">
              <span className="spinner-sm" />
              <span>Loading map…</span>
            </div>
          )}
        </div>

        <div className="header-right">
          <span className="header-hint">Click an area to inspect</span>
        </div>
      </header>

      {/* ── Error Banner ──────────────────────────────────────────────── */}
      {mapError && (
        <div className="error-banner">
          <AlertCircle size={15} />
          <span>{mapError}</span>
          <button className="error-close" onClick={() => setMapError(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Left Panel: Layer Controls ────────────────────────────────── */}
      <LayerControls
        layers={layerVisibility}
        onToggle={toggleLayer}
        mapReady={mapReady}
      />

      {/* ── Right Panel: Inspector + Insights ────────────────────────── */}
      {/* <aside className="right-panel">

        <div className="tab-bar">
          <button
            className={`tab-btn ${activeTab === "inspector" ? "tab-btn--active" : ""}`}
            onClick={() => setActiveTab("inspector")}
          >
            <MapPin size={13} />
            Inspector
          </button>
          <button
            className={`tab-btn ${activeTab === "insights" ? "tab-btn--active" : ""}`}
            onClick={() => setActiveTab("insights")}
          >
            <Activity size={13} />
            Insights
          </button>
        </div>

        <div className="right-panel-body">
          {activeTab === "inspector" && (
            <NeighborhoodInspector data={inspectorData} />
          )}
          {activeTab === "insights" && (
            <InsightPanel
              homeValueLayer={layers.homeValue}
              incomeLayer={layers.income}
              mapReady={mapReady}
            />
          )}
        </div>
      </aside> */}
    </div>
  );
}

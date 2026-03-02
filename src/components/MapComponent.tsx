import { useEffect, useRef } from "react";
import esriConfig from "@arcgis/core/config";
import WebMap from "@arcgis/core/WebMap";
import MapView from "@arcgis/core/views/MapView";
import { watch } from "@arcgis/core/core/reactiveUtils";
import type Layer from "@arcgis/core/layers/Layer";
import { ARCGIS_CONFIG, ARCGIS_ASSETS_PATH, FIELD_NAMES } from "../config/arcgis";
import { calculateAffordabilityScore } from "../utils/dataUtils";
import type { LocationData } from "../utils/dataUtils";

esriConfig.apiKey = ARCGIS_CONFIG.apiKey;
esriConfig.assetsPath = ARCGIS_ASSETS_PATH;

type Handle = { remove(): void };

interface MapComponentProps {
  onMapReady: (view: MapView, homeValueLayer: Layer | null, incomeLayer: Layer | null) => void;
  onLocationClick: (data: LocationData | null) => void;
  onError: (message: string) => void;
}

export default function MapComponent({ onMapReady, onLocationClick, onError }: MapComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<MapView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Handles declared here so the cleanup closure can remove them
    let featuresHandle: Handle | null = null;
    let visibleHandle: Handle | null  = null;

    const webmap = new WebMap({
      portalItem: { id: ARCGIS_CONFIG.webMapId },
    });

    const view = new MapView({
      container: containerRef.current,
      map: webmap,
      center: ARCGIS_CONFIG.defaultCenter,
      zoom: ARCGIS_CONFIG.defaultZoom,
      ui: { components: ["zoom", "compass"] },
    });

    viewRef.current = view;

    view.when(() => {
      const homeValueLayer = webmap.allLayers.find(
        (l) => l.title === ARCGIS_CONFIG.homeValueLayerTitle
      ) ?? null;
      const incomeLayer = webmap.allLayers.find(
        (l) => l.title === ARCGIS_CONFIG.incomeLayerTitle
      ) ?? null;

      console.log("[HomeScope] homeValueLayer:", homeValueLayer?.type, homeValueLayer?.title);
      console.log("[HomeScope] incomeLayer:",    incomeLayer?.type,    incomeLayer?.title);

      if (!homeValueLayer && !incomeLayer) {
        onError(
          `Could not find layers named "${ARCGIS_CONFIG.homeValueLayerTitle}" or ` +
          `"${ARCGIS_CONFIG.incomeLayerTitle}" in your Web Map. ` +
          "Check the layer titles in src/config/arcgis.ts."
        );
      }

      onMapReady(view, homeValueLayer, incomeLayer);

      // ── Watch popup features via reactiveUtils (SDK 5.x API) ──────────
      // The popup already retrieves features correctly on click — reuse that
      // data rather than running a separate hitTest.
      featuresHandle = watch(
        () => view.popup?.features,
        (features) => {
          if (!features?.length) return;

          // Log raw attributes so field names can be verified in config
          console.log(
            "[HomeScope] Popup features:",
            features.map((f) => ({ layer: f.layer?.title, attrs: f.attributes }))
          );

          const hvFeature = features.find(
            (f) =>
              f.layer?.title === ARCGIS_CONFIG.homeValueLayerTitle ||
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (f.layer as any)?.parent?.title === ARCGIS_CONFIG.homeValueLayerTitle
          );
          const incFeature = features.find(
            (f) =>
              f.layer?.title === ARCGIS_CONFIG.incomeLayerTitle ||
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (f.layer as any)?.parent?.title === ARCGIS_CONFIG.incomeLayerTitle
          );

          if (!hvFeature && !incFeature) return;

          const homeValueAttrs = hvFeature?.attributes  ?? null;
          const incomeAttrs    = incFeature?.attributes ?? null;

          const areaName =
            (homeValueAttrs?.[FIELD_NAMES.homeValue.name] as string | undefined) ??
            (incomeAttrs?.[FIELD_NAMES.income.name]       as string | undefined) ??
            "Unknown";

          const medianHomeValue = (homeValueAttrs?.[FIELD_NAMES.homeValue.value] as number | undefined) ?? null;
          const medianIncome    = (incomeAttrs?.[FIELD_NAMES.income.value]       as number | undefined) ?? null;

          const affordabilityScore =
            medianHomeValue != null && medianIncome != null
              ? calculateAffordabilityScore(medianHomeValue, medianIncome)
              : null;

          const priceToIncomeRatio =
            medianHomeValue != null && medianIncome != null && medianIncome > 0
              ? Math.round((medianHomeValue / medianIncome) * 10) / 10
              : null;

          onLocationClick({
            areaName,
            medianHomeValue,
            medianIncome,
            affordabilityScore,
            priceToIncomeRatio,
          });
        }
      );

      // Clear the inspector when the popup is dismissed
      visibleHandle = watch(
        () => view.popup?.visible,
        (visible) => { if (!visible) onLocationClick(null); }
      );
    });

    return () => {
      featuresHandle?.remove();
      visibleHandle?.remove();
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0, zIndex: 0 }}
    />
  );
}

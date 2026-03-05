// =============================================================
//  ARCGIS CONFIGURATION
//  API key and Web Map ID are read from .env.local — never
//  commit real credentials to source control.
//
//  Create arcgis-demo/.env.local and add:
//    REACT_APP_ARCGIS_API_KEY=your_key_here
//    REACT_APP_WEBMAP_ID=your_map_id_here
// =============================================================

export interface ArcGISConfig {
  apiKey: string;
  webMapId: string;
  homeValueLayerTitle: string;
  incomeLayerTitle: string;
  defaultCenter: [number, number];
  defaultZoom: number;
}

export interface FieldConfig {
  name: string;
  joinId: string;
  value: string;
}

export interface FieldNames {
  homeValue: FieldConfig;
  income: FieldConfig;
}

export const ARCGIS_CONFIG: ArcGISConfig = {
  apiKey:   "AAPTadEkCvOQZU2Sc397meLeK0w..hG81-JpXN5BTvk6PHCowo_0feWmBjxO9TMuNGH8KrDJgA9ODDucwCKopvCc99l7YOMnjp_GLI8lmwn6qGRh-yTwDDhpdDmYIbCKhIwFfbu1WmuhXRRM4nS7ZAse6u3fHZmHLzeWBG15h_0TGYKm-9Kv_KQhJ0_arDTQmQroOoht49DtgnO4uMq_Vifz_Akazg9lIrCcsgbaOyTVsT_X6Cl5ogq_Vq9asKkpVpN3usjWhLpH5JT5MHopoRSa1U_glbOFaHfw9AT1_PnmpWZgl",
  webMapId: "92ce453d713442aeab4caa3bd9aec1e1",

  // Exact layer titles as they appear inside your Web Map.
  // Check: ArcGIS Online → Open Map → Layers panel.
  homeValueLayerTitle: "USA Esri Demographics (Latest) - 2025 Median Home Value",
  incomeLayerTitle:    "USA Esri Demographics (Latest) - 2025 Median Household Income",

  // Default map center [longitude, latitude] and zoom level.
  defaultCenter: [-98.5795, 39.8283],
  defaultZoom: 4,
};

// =============================================================
//  FIELD NAME MAPPINGS
//  These match the Esri Demographics (Living Atlas) standard
//  field naming. Verify against your layer's Attribute Table
//  in ArcGIS Online if any values show "No data".
// =============================================================
export const FIELD_NAMES: FieldNames = {
  homeValue: {
    name:   "NAME",       // Area name (e.g. census tract name)
    joinId: "FIPS",       // Geographic join key shared between both layers
    value:  "MEDVAL_CY",  // 2025 Median Home Value (USD)
  },
  income: {
    name:   "NAME",       // Area name
    joinId: "FIPS",       // Geographic join key
    value:  "MEDHINC_FY", // 2025 Median Household Income (USD)
  },
};

// =============================================================
//  ARCGIS ASSETS PATH  (CDN)
//  Version must match your installed @arcgis/core package.
//  Check node_modules/@arcgis/core/package.json → "version"
//  If you see missing icons/fonts, update the version below.
// =============================================================
export const ARCGIS_ASSETS_PATH = "https://js.arcgis.com/5.0/@arcgis/core/assets";

// =============================================================
//  DATA UTILITIES
//  Helper functions for affordability scores, formatting, and
//  data processing across the app.
// =============================================================

import type { FieldNames } from "../config/arcgis";

export interface AffordabilityRating {
  label: string;
  color: string;
}

export interface AreaData {
  name: string;
  medianHomeValue: number | null;
  medianIncome: number | null;
  affordabilityScore: number | null;
  priceToIncomeRatio: number | null;
}

export interface LocationData {
  areaName: string;
  medianHomeValue: number | null;
  medianIncome: number | null;
  affordabilityScore: number | null;
  priceToIncomeRatio: number | null;
}

// Minimal interface for ArcGIS Graphic objects — only the parts we use
interface ArcGISGraphic {
  attributes?: Record<string, unknown>;
}

/**
 * Calculates an Affordability Score (0–100) from the
 * Price-to-Income Ratio (PIR = home value / household income).
 *
 * Based on standard housing affordability benchmarks:
 *   PIR ≤ 3  → score 100 (very affordable)
 *   PIR = 6  → score  50 (moderately unaffordable)
 *   PIR ≥ 9  → score   0 (severely unaffordable)
 *
 * @param homeValue  Median home value in USD
 * @param income     Median household income in USD
 * @returns          0–100, or null if inputs are invalid
 */
export function calculateAffordabilityScore(
  homeValue: number | null | undefined,
  income: number | null | undefined
): number | null {
  if (!homeValue || !income || income <= 0) return null;
  const ratio = homeValue / income;
  return Math.max(0, Math.min(100, Math.round(((9 - ratio) / 6) * 100)));
}

/**
 * Returns a label and color for an affordability score.
 * @param score  0–100
 */
export function getAffordabilityRating(score: number): AffordabilityRating {
  if (score >= 80) return { label: "Very Affordable", color: "#00d4aa" };
  if (score >= 60) return { label: "Affordable",      color: "#4ade80" };
  if (score >= 40) return { label: "Moderate",        color: "#fbbf24" };
  if (score >= 20) return { label: "Expensive",       color: "#f97316" };
  return               { label: "Very Expensive",  color: "#ef4444" };
}

/**
 * Formats a number as a USD currency string.
 * e.g. 485000 → "$485,000"
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formats a number with commas.
 * e.g. 1234 → "1,234"
 */
export function formatNumber(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "N/A";
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Joins home-value and income feature sets by FIPS code,
 * falling back to normalized area name if FIPS is absent.
 * Returns an array of combined area objects.
 *
 * @param homeValueFeatures  ArcGIS Graphic[] from home value layer
 * @param incomeFeatures     ArcGIS Graphic[] from income layer
 * @param fields             FIELD_NAMES config
 */
export function joinAreaData(
  homeValueFeatures: ArcGISGraphic[],
  incomeFeatures: ArcGISGraphic[],
  fields: FieldNames
): AreaData[] {
  // Build a lookup from the income layer keyed by FIPS then by name
  const incomeByFips = new Map<string, unknown>();
  const incomeByName = new Map<string, unknown>();

  incomeFeatures.forEach((f) => {
    const fips   = f.attributes?.[fields.income.joinId];
    const name   = f.attributes?.[fields.income.name];
    const income = f.attributes?.[fields.income.value];

    if (fips != null) incomeByFips.set(String(fips), income);
    if (name != null) incomeByName.set(String(name).trim().toLowerCase(), income);
  });

  return homeValueFeatures
    .map((f): AreaData | null => {
      const fips      = f.attributes?.[fields.homeValue.joinId];
      const name      = f.attributes?.[fields.homeValue.name];
      const homeValue = f.attributes?.[fields.homeValue.value];

      if (name == null && fips == null) return null;

      // Prefer FIPS join, fall back to name
      const rawIncome: unknown =
        (fips != null && incomeByFips.has(String(fips)))
          ? incomeByFips.get(String(fips))
          : name != null
          ? incomeByName.get(String(name).trim().toLowerCase()) ?? null
          : null;

      const numericHomeValue = typeof homeValue  === "number" ? homeValue  : null;
      const numericIncome    = typeof rawIncome  === "number" ? rawIncome  : null;

      const affordabilityScore =
        numericHomeValue != null && numericIncome != null
          ? calculateAffordabilityScore(numericHomeValue, numericIncome)
          : null;

      return {
        name:               String(name ?? fips ?? "Unknown").trim(),
        medianHomeValue:    numericHomeValue,
        medianIncome:       numericIncome,
        affordabilityScore,
        priceToIncomeRatio:
          numericHomeValue != null && numericIncome != null && numericIncome > 0
            ? Math.round((numericHomeValue / numericIncome) * 10) / 10
            : null,
      };
    })
    .filter((item): item is AreaData => item !== null);
}

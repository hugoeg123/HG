export type ConcUnit = "mg/mL" | "mcg/mL";
export type Conc = { value: number; unit: ConcUnit };

export function toMcgPerMl(c: Conc): number {
  return c.unit === "mg/mL" ? c.value * 1000 : c.value;
}
export function toMgPerMl(c: Conc): number {
  return c.unit === "mcg/mL" ? c.value / 1000 : c.value;
}
export function toCommonConc(c: Conc): { mcgPerMl: number; mgPerMl: number } {
  return { mcgPerMl: toMcgPerMl(c), mgPerMl: toMgPerMl(c) };
}
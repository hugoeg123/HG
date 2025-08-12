/** Converte "pt-BR" (ex.: "0,2") para number. Aceita number direto. */
export function ptNumber(input: string | number): number {
  if (typeof input === "number") return input;
  if (typeof input !== "string") return NaN;
  const s = input.trim().replace(/\s+/g, "").replace(/,/g, ".");
  if (!s) return NaN;
  return Number(s);
}

export function clamp(x: number, min: number, max: number): number {
  if (Number.isNaN(x)) return x;
  return Math.min(Math.max(x, min), max);
}

export function roundTo(x: number, places: number): number {
  const f = 10 ** places;
  return Math.round((x + Number.EPSILON) * f) / f;
}

export function ceilTo(x: number, step: number): number {
  return Math.ceil(x / step) * step;
}
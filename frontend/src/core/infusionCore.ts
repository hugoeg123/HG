import { Conc, toMcgPerMl } from "./units";
import { roundTo } from "./number";

export type DropFactor = 10 | 15 | 20 | 60;

export type InfusionCtx = {
  weightKg?: number;       // obrigatório quando há mcg/kg/min
  conc: Conc;              // mg/mL ou mcg/mL
  dropFactor?: DropFactor; // obrigatório quando há gtt/min
};

/** --------- gtt/min ↔ mL/h --------- */
export function gttMinToMlH(gttPerMin: number, dropFactor: DropFactor): number {
  return gttPerMin * (60 / dropFactor);
}
export function mlHToGttMin(mlPerHour: number, dropFactor: DropFactor): number {
  return mlPerHour * (dropFactor / 60);
}

/** --------- mcg/kg/min ↔ mL/h --------- */
export function mcgKgMinToMlH(dose: number, ctx: InfusionCtx): number {
  if (!ctx.weightKg || ctx.weightKg <= 0) throw new Error("Peso (kg) é obrigatório e deve ser > 0.");
  const concMcgMl = toMcgPerMl(ctx.conc);
  if (concMcgMl <= 0) throw new Error("Concentração deve ser > 0.");
  return (dose * ctx.weightKg * 60) / concMcgMl;
}
export function mlHToMcgKgMin(mlPerHour: number, ctx: InfusionCtx): number {
  if (!ctx.weightKg || ctx.weightKg <= 0) throw new Error("Peso (kg) é obrigatório e deve ser > 0.");
  const concMcgMl = toMcgPerMl(ctx.conc);
  if (concMcgMl <= 0) throw new Error("Concentração deve ser > 0.");
  return (mlPerHour * concMcgMl) / (ctx.weightKg * 60);
}

/** --------- mcg/kg/min ↔ gtt/min (direto) --------- */
export function mcgKgMinToGttMin(dose: number, ctx: InfusionCtx): number {
  if (!ctx.weightKg || ctx.weightKg <= 0) throw new Error("Peso (kg) é obrigatório e deve ser > 0.");
  if (!ctx.dropFactor) throw new Error("Fator de gotas é obrigatório.");
  const concMcgMl = toMcgPerMl(ctx.conc);
  if (concMcgMl <= 0) throw new Error("Concentração deve ser > 0.");
  return (dose * ctx.weightKg * ctx.dropFactor) / concMcgMl;
}
export function gttMinToMcgKgMin(gttPerMin: number, ctx: InfusionCtx): number {
  if (!ctx.weightKg || ctx.weightKg <= 0) throw new Error("Peso (kg) é obrigatório e deve ser > 0.");
  if (!ctx.dropFactor) throw new Error("Fator de gotas é obrigatório.");
  const concMcgMl = toMcgPerMl(ctx.conc);
  if (concMcgMl <= 0) throw new Error("Concentração deve ser > 0.");
  return (gttPerMin * concMcgMl) / (ctx.weightKg * ctx.dropFactor);
}

/** Formatações padrão de saída (para UI) */
export const format = {
  mlh: (x: number) => roundTo(x, 2), // 2 casas decimais
  gtt: (x: number) => Math.round(x),
  mcgKgMin: (x: number) => roundTo(x, 2),
};

/* Opcional para depois: formatação adaptativa
export const formatAdaptive = {
  mlh: (x: number) => (x < 100 ? roundTo(x, 2) : roundTo(x, 1)),
  gtt: (x: number) => Math.round(x),
  mcgKgMin: (x: number) => roundTo(x, 2),
};
*/
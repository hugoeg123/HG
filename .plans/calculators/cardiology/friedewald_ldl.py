"""
Calculadora de LDL‑colesterol pelo método de Friedewald.

Quando triglicerídeos não estão muito elevados (≤ 400 mg/dL), o LDL pode ser
estimado pela fórmula de Friedewald:

    LDL (mg/dL) = colesterol_total – HDL – (triglicerídeos / 5)

Referência: NCEP/ATP III – fórmula de Friedewald【494884547596442†L594-L609】.
"""

from typing import Dict


def calculate_ldl(total_cholesterol_mg_dl: float, hdl_mg_dl: float, triglycerides_mg_dl: float) -> float:
    """Calcula o colesterol LDL estimado pela fórmula de Friedewald.

    Args:
        total_cholesterol_mg_dl: Colesterol total em mg/dL.
        hdl_mg_dl: HDL-colesterol em mg/dL.
        triglycerides_mg_dl: Triglicerídeos em mg/dL.

    Returns:
        float: LDL-colesterol estimado em mg/dL.

    Raises:
        ValueError: se valores forem não positivos ou se triglicerídeos excederem 400 mg/dL (método inválido).
    """
    if total_cholesterol_mg_dl < 0 or hdl_mg_dl < 0 or triglycerides_mg_dl < 0:
        raise ValueError("Os valores de colesterol e triglicerídeos não podem ser negativos.")
    if triglycerides_mg_dl > 400:
        raise ValueError("A fórmula de Friedewald não é válida para triglicerídeos > 400 mg/dL.")
    return total_cholesterol_mg_dl - hdl_mg_dl - (triglycerides_mg_dl / 5.0)


def example() -> Dict[str, float]:
    """Exemplo de cálculo do LDL.

    Returns:
        dict: Entradas e LDL calculado.
    """
    tc = 200.0  # mg/dL
    hdl = 50.0  # mg/dL
    tg = 150.0  # mg/dL
    ldl = calculate_ldl(tc, hdl, tg)
    return {"colesterol_total": tc, "HDL": hdl, "triglicerideos": tg, "LDL": ldl}

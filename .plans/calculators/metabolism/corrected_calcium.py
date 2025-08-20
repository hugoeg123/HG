"""
Correção do cálcio sérico pela albumina.

O cálcio total medido pode ser subestimado em pacientes com hipoalbuminemia.  A
fórmula mais comum corrige o cálcio sérico adicionando um fator de 0,8 mg/dL para
cada g/dL de albumina abaixo de 4 g/dL:

    Ca_corr = Ca_medido + 0,8 × (4,0 – albumina)

Referência: EBM Consult – cálculo do cálcio corrigido【269570755257146†L83-L87】.
"""

from typing import Dict


def calculate_corrected_calcium(calcium_mg_dl: float, albumin_g_dl: float, normal_albumin: float = 4.0) -> float:
    """Calcula o cálcio sérico corrigido pela albumina.

    Args:
        calcium_mg_dl: Cálcio total medido, em mg/dL.
        albumin_g_dl: Albumina sérica, em g/dL.
        normal_albumin: Valor de referência de albumina (padrão 4 g/dL).

    Returns:
        float: Cálcio corrigido em mg/dL.

    Raises:
        ValueError: se o cálcio ou a albumina forem valores não positivos.
    """
    if calcium_mg_dl <= 0 or albumin_g_dl <= 0:
        raise ValueError("Cálcio e albumina devem ser maiores que zero.")
    return calcium_mg_dl + 0.8 * (normal_albumin - albumin_g_dl)


def example() -> Dict[str, float]:
    """Exemplo de uso da correção do cálcio.

    Returns:
        dict: Entradas e resultado corrigido.
    """
    ca = 8.0  # mg/dL
    alb = 2.5  # g/dL
    corrected = calculate_corrected_calcium(ca, alb)
    return {"calcio_medido": ca, "albumina": alb, "calcio_corrigido": corrected}

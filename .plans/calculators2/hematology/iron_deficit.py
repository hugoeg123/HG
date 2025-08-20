"""
Calculadora de déficit total de ferro (fórmula de Ganzoni).

A fórmula de Ganzoni estima a quantidade total de ferro necessária para correção
da anemia ferropriva, considerando o peso do paciente, a diferença entre a
hemoglobina alvo e a atual e um fator de 2,4 que combina o volume sanguíneo
e o teor de hemoglobina.  Um valor adicional (ferro de depósito) geralmente
é somado para repor as reservas.

    Deficit (mg) = peso (kg) × (Hb_alvo – Hb_atual) × 2,4 + ferro_de_depósito

Referência: GlobalRPH – fórmula de Ganzoni【268007991159399†L133-L139】.
"""

from typing import Dict


def calculate_iron_deficit(weight_kg: float, hb_target_g_dl: float, hb_current_g_dl: float, deposit_mg: float = 500.0, factor: float = 2.4) -> float:
    """Calcula o déficit total de ferro usando a fórmula de Ganzoni.

    Args:
        weight_kg: Peso corporal em quilogramas.
        hb_target_g_dl: Hemoglobina alvo em g/dL.
        hb_current_g_dl: Hemoglobina atual em g/dL.
        deposit_mg: Ferro de depósito (mg) a ser adicionado para reposição das reservas (padrão 500 mg).
        factor: Fator multiplicativo (padrão 2,4).

    Returns:
        float: Déficit total de ferro em miligramas.

    Raises:
        ValueError: se valores forem negativos ou inconsistentes (por exemplo, Hb_alvo ≤ Hb_atual).
    """
    if weight_kg <= 0:
        raise ValueError("O peso deve ser positivo.")
    if hb_target_g_dl <= hb_current_g_dl:
        raise ValueError("A hemoglobina alvo deve ser maior que a hemoglobina atual.")
    if factor <= 0:
        raise ValueError("O fator deve ser positivo.")
    return weight_kg * (hb_target_g_dl - hb_current_g_dl) * factor + deposit_mg


def example() -> Dict[str, float]:
    """Exemplo de uso da calculadora de déficit de ferro.

    Returns:
        dict: Entradas e resultado do cálculo.
    """
    weight = 70.0  # kg
    hb_target = 13.0  # g/dL
    hb_current = 8.0  # g/dL
    deficit = calculate_iron_deficit(weight, hb_target, hb_current)
    return {"peso": weight, "Hb_alvo": hb_target, "Hb_atual": hb_current, "deficit_ferro": deficit}

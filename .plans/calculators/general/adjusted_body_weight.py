"""
Calculadora de peso corporal ajustado.

O peso corporal ajustado (AjBW) é utilizado na farmacocinética de pacientes
obesos quando o peso corporal ideal (IBW) subestima as necessidades.  A fórmula
mais empregada é:

    AjBW = IBW + 0,4 × (peso_atual – IBW)

Referência: fórmulas de ajuste de peso【786873193218403†L140-L144】.
"""

from typing import Dict


def calculate_adjusted_body_weight(actual_weight_kg: float, ideal_weight_kg: float) -> float:
    """Calcula o peso corporal ajustado.

    Args:
        actual_weight_kg: Peso corporal atual em quilogramas.
        ideal_weight_kg: Peso corporal ideal em quilogramas.

    Returns:
        float: Peso corporal ajustado.

    Raises:
        ValueError: se os pesos não forem positivos ou se o peso atual for menor que o peso ideal.
    """
    if actual_weight_kg <= 0 or ideal_weight_kg <= 0:
        raise ValueError("Os pesos devem ser positivos.")
    if actual_weight_kg < ideal_weight_kg:
        raise ValueError("O peso atual deve ser maior ou igual ao peso ideal para aplicar a fórmula de ajuste.")
    return ideal_weight_kg + 0.4 * (actual_weight_kg - ideal_weight_kg)


def example() -> Dict[str, float]:
    """Exemplo de uso da calculadora de peso corporal ajustado.

    Returns:
        dict: Exemplo de entradas e resultado.
    """
    ibw = 70.0  # kg
    actual = 100.0  # kg
    ajbw = calculate_adjusted_body_weight(actual, ibw)
    return {"peso_ideal": ibw, "peso_atual": actual, "peso_ajustado": ajbw}

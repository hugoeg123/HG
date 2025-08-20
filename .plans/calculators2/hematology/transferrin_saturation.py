"""
Calculadora de índice de saturação de transferrina (IST).

O IST indica a fração das proteínas transportadoras de ferro que estão ocupadas
com ferro.  É calculado dividindo-se o ferro sérico pela capacidade total de
ligação de ferro (TIBC) e multiplicando por 100 para obter um valor em
percentagem:

    IST (%) = (ferro_sérico / TIBC) × 100

Referência: StatPearls – iron binding capacity【867153819379181†L123-L125】.
"""

from typing import Dict


def calculate_transferrin_saturation(iron_serum_ug_dl: float, tibc_ug_dl: float) -> float:
    """Calcula o índice de saturação de transferrina (IST).

    Args:
        iron_serum_ug_dl: Ferro sérico em μg/dL.
        tibc_ug_dl: Capacidade total de ligação de ferro (TIBC) em μg/dL.

    Returns:
        float: Saturação de transferrina em porcentagem (%).

    Raises:
        ValueError: se valores forem não positivos ou se TIBC for zero.
    """
    if iron_serum_ug_dl < 0 or tibc_ug_dl <= 0:
        raise ValueError("O ferro sérico não pode ser negativo e o TIBC deve ser positivo.")
    return (iron_serum_ug_dl / tibc_ug_dl) * 100


def example() -> Dict[str, float]:
    """Exemplo de uso do IST.

    Returns:
        dict: Entradas e valor de saturação calculado.
    """
    iron = 50.0  # μg/dL
    tibc = 300.0  # μg/dL
    ist = calculate_transferrin_saturation(iron, tibc)
    return {"ferro_serico": iron, "TIBC": tibc, "IST": ist}

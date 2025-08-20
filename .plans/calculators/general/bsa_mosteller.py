"""
Calculadora de superfície corporal (Body Surface Area) pelo método de Mosteller.

A fórmula de Mosteller calcula a área de superfície corporal (ASC) utilizando o produto entre altura (cm) e peso (kg) dividido por 3600 e tomando a raiz quadrada【372537320866944†L39-L44】.
"""

from typing import Dict
import math

def calculate_bsa_mosteller(height_cm: float, weight_kg: float) -> float:
    """Calcula a superfície corporal pela fórmula de Mosteller.

    Args:
        height_cm: Altura em centímetros.
        weight_kg: Peso em quilogramas.

    Returns:
        float: Área de superfície corporal em metros quadrados (m²).

    Raises:
        ValueError: se altura ou peso forem não positivos.
    """
    if height_cm <= 0:
        raise ValueError("A altura deve ser maior que zero.")
    if weight_kg <= 0:
        raise ValueError("O peso deve ser maior que zero.")
    return math.sqrt((height_cm * weight_kg) / 3600.0)


def example() -> Dict[str, float]:
    """Exemplo de uso da fórmula de Mosteller.

    Returns:
        dict: Entradas e resultado.
    """
    h_cm = 170.0
    w_kg = 65.0
    bsa = calculate_bsa_mosteller(h_cm, w_kg)
    return {"altura_cm": h_cm, "peso_kg": w_kg, "bsa_m2": bsa}

"""
Calculadora de Índice de Massa Corporal (IMC).

O IMC é calculado dividindo-se o peso (em quilogramas) pelo quadrado da altura (em metros).  Esta função não realiza validação de faixas; entradas devem ser números positivos.

Referência: Centers for Disease Control and Prevention (CDC) – BMI formula【265914223290611†L91-L95】.
"""

from typing import Dict

def calculate_bmi(weight_kg: float, height_m: float) -> float:
    """Calcula o índice de massa corporal.

    Args:
        weight_kg: Peso em quilogramas.
        height_m: Altura em metros.

    Returns:
        float: IMC calculado.

    Raises:
        ValueError: se peso ou altura forem não positivos.
    """
    if weight_kg <= 0:
        raise ValueError("O peso deve ser maior que zero.")
    if height_m <= 0:
        raise ValueError("A altura deve ser maior que zero.")
    return weight_kg / (height_m ** 2)


def example() -> Dict[str, float]:
    """Exemplo de uso da calculadora de IMC.

    Returns:
        dict: Um exemplo de resultado com entradas e saída.
    """
    weight = 70.0  # kg
    height = 1.75  # m
    imc = calculate_bmi(weight, height)
    return {"peso": weight, "altura": height, "imc": imc}

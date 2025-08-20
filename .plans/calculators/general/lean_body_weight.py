"""
Calculadora de peso corporal magro (lean body weight).

Utiliza as fórmulas de Hume para estimar a massa magra:

* Homens: `LBW = 0,32810 × peso + 0,33929 × altura_cm – 29,5336`
* Mulheres: `LBW = 0,29569 × peso + 0,41813 × altura_cm – 43,2933`

Referência: GlobalRPH – fórmulas de Hume para massa magra【786873193218403†L256-L260】.
"""

from typing import Dict


def calculate_lean_body_weight(sex: str, weight_kg: float, height_cm: float) -> float:
    """Calcula a massa corporal magra (LBW) usando as equações de Hume.

    Args:
        sex: Sexo do paciente ('M' ou 'F').
        weight_kg: Peso atual em quilogramas.
        height_cm: Altura em centímetros.

    Returns:
        float: Peso corporal magro em quilogramas.

    Raises:
        ValueError: se parâmetros forem inválidos.
    """
    if weight_kg <= 0 or height_cm <= 0:
        raise ValueError("O peso e a altura devem ser positivos.")
    sex_upper = sex.upper()
    if sex_upper not in {"M", "F"}:
        raise ValueError("O sexo deve ser 'M' ou 'F'.")
    if sex_upper == "M":
        lbw = 0.32810 * weight_kg + 0.33929 * height_cm - 29.5336
    else:
        lbw = 0.29569 * weight_kg + 0.41813 * height_cm - 43.2933
    return lbw


def example() -> Dict[str, float]:
    """Exemplo de uso da calculadora de peso corporal magro.

    Returns:
        dict: Entradas e resultado calculado.
    """
    sex = 'F'
    weight = 60.0  # kg
    height = 165.0  # cm
    lbw = calculate_lean_body_weight(sex, weight, height)
    return {"sexo": sex, "peso": weight, "altura_cm": height, "peso_magreza": lbw}

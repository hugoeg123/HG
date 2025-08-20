"""
Calculadora de peso corporal ideal (Devine).

O peso corporal ideal (PC ideal) é usado para dosagem de medicamentos e avaliação nutricional.
Esta implementação utiliza a fórmula de Devine, adaptada para centímetros:

* Homens: `IBW (kg) = 50 + 0,9 × (altura_cm – 152)`
* Mulheres: `IBW (kg) = 45,5 + 0,9 × (altura_cm – 152)`

Referência: GlobalRPH – fórmulas de peso ideal【786873193218403†L130-L133】.
"""

from typing import Dict


def calculate_ideal_body_weight(sex: str, height_cm: float) -> float:
    """Calcula o peso corporal ideal utilizando a fórmula de Devine.

    Args:
        sex: Sexo do paciente ('M' para masculino ou 'F' para feminino).  Letras
            minúsculas também são aceitas.
        height_cm: Altura em centímetros.

    Returns:
        float: Peso corporal ideal em quilogramas.

    Raises:
        ValueError: se a altura for não positiva ou se o sexo não estiver entre 'M' ou 'F'.
    """
    if height_cm <= 0:
        raise ValueError("A altura deve ser maior que zero.")
    sex_upper = sex.upper()
    if sex_upper not in {"M", "F"}:
        raise ValueError("O sexo deve ser 'M' (masculino) ou 'F' (feminino).")
    # Devine formula: base weight plus 0.9 kg per cm over 152 cm
    if sex_upper == "M":
        base = 50.0
    else:
        base = 45.5
    return base + 0.9 * (height_cm - 152)


def example() -> Dict[str, float]:
    """Exemplo de uso da calculadora de peso ideal.

    Returns:
        dict: Exemplo de entradas e resultado.
    """
    height = 175.0  # cm
    sex = 'M'
    ibw = calculate_ideal_body_weight(sex, height)
    return {"altura_cm": height, "sexo": sex, "peso_ideal_kg": ibw}

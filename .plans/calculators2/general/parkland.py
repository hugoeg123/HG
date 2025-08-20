"""
Calculadora da fórmula de Parkland para reposição volêmica em queimaduras.

A fórmula de Parkland estima a quantidade de cristaloide necessária nas primeiras 24 horas após uma grande queimadura.  Para adultos, administra‑se 4 mL × peso (kg) × superfície corporal queimada (%TBSA); para crianças, 3 mL × peso × %TBSA.  Metade do volume deve ser dado nas primeiras 8 horas【39425667587724†L155-L266】.
"""

from typing import Dict

def calculate_parkland(weight_kg: float, tbsa_percent: float, pediatric: bool=False) -> Dict[str, float]:
    """Calcula o volume total de reposição de cristaloide pelo método de Parkland.

    Args:
        weight_kg: Peso do paciente em quilogramas.
        tbsa_percent: Porcentagem de superfície corporal total queimada (somente queimaduras de 2º ou 3º grau).
        pediatric: Verdadeiro para pacientes pediátricos (utiliza 3 mL), falso para adultos (4 mL).

    Returns:
        dict: Volume total em mL nas primeiras 24 h e volumes nas primeiras 8 h e nas 16 h subsequentes.

    Raises:
        ValueError: se peso ou superfície corporal forem não positivos.
    """
    if weight_kg <= 0:
        raise ValueError("O peso deve ser maior que zero.")
    if tbsa_percent <= 0:
        raise ValueError("A superfície corporal queimada deve ser maior que zero.")
    factor = 3.0 if pediatric else 4.0
    total_volume = factor * weight_kg * tbsa_percent
    first_8_hours = total_volume / 2.0
    next_16_hours = total_volume / 2.0
    return {
        "volume_total_ml": total_volume,
        "volume_0_8h_ml": first_8_hours,
        "volume_8_24h_ml": next_16_hours
    }


def example() -> Dict[str, float]:
    """Exemplo de cálculo de Parkland para um adulto com 20% de SCQ e 70 kg.

    Returns:
        dict: Resultados de volume.
    """
    weight = 70.0
    tbsa = 20.0
    volumes = calculate_parkland(weight, tbsa, pediatric=False)
    return volumes

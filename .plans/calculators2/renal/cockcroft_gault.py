"""
Calculadora de depuração de creatinina pela fórmula de Cockcroft–Gault.

Esta equação estima o clearance de creatinina com base na idade, peso, creatinina sérica e sexo do paciente.  Para mulheres, multiplica‑se o resultado por 0,85.  Fórmula: `CrCl = ((140 – idade) × peso) / (72 × creatinina)`【755153964960023†L588-L599】.
"""

from typing import Dict

def calculate_cockcroft_gault(age_years: float, weight_kg: float, creatinine_mg_dl: float, female: bool) -> float:
    """Calcula a depuração de creatinina pela fórmula de Cockcroft–Gault.

    Args:
        age_years: Idade em anos.
        weight_kg: Peso em quilogramas.
        creatinine_mg_dl: Creatinina sérica em mg/dL.
        female: Verdadeiro se paciente for do sexo feminino, falso se masculino.

    Returns:
        float: Clearance estimado em mL/min.

    Raises:
        ValueError: se alguma entrada for não positiva.
    """
    if age_years <= 0:
        raise ValueError("A idade deve ser maior que zero.")
    if weight_kg <= 0:
        raise ValueError("O peso deve ser maior que zero.")
    if creatinine_mg_dl <= 0:
        raise ValueError("A creatinina deve ser maior que zero.")
    crcl = ((140.0 - age_years) * weight_kg) / (72.0 * creatinine_mg_dl)
    if female:
        crcl *= 0.85
    return crcl


def example() -> Dict[str, float]:
    """Exemplo de uso da fórmula de Cockcroft–Gault.

    Returns:
        dict: Entradas e clearance estimado.
    """
    age = 65.0
    weight = 70.0
    cr = 1.2
    crcl_male = calculate_cockcroft_gault(age, weight, cr, female=False)
    crcl_female = calculate_cockcroft_gault(age, weight, cr, female=True)
    return {"idade": age, "peso": weight, "creatinina": cr, "crcl_masculino": crcl_male, "crcl_feminino": crcl_female}

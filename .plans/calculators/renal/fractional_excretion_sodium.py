"""
Calculadora da fração de excreção de sódio (FeNa).

A FeNa ajuda a diferenciar causas pré‑renais de lesão renal intrínseca.  É calculada a partir das concentrações de sódio e creatinina na urina e no plasma【689935032807257†L170-L172】.
"""

from typing import Dict

def calculate_fena(urine_sodium_meq_l: float, plasma_sodium_meq_l: float,
                    urine_creatinine_mg_dl: float, plasma_creatinine_mg_dl: float) -> float:
    """Calcula a fração de excreção de sódio (FeNa).

    Args:
        urine_sodium_meq_l: Sódio urinário em mEq/L.
        plasma_sodium_meq_l: Sódio plasmático em mEq/L.
        urine_creatinine_mg_dl: Creatinina urinária em mg/dL.
        plasma_creatinine_mg_dl: Creatinina sérica em mg/dL.

    Returns:
        float: FeNa em porcentagem.

    Raises:
        ValueError: se algum parâmetro for não positivo.
    """
    if urine_sodium_meq_l <= 0 or plasma_sodium_meq_l <= 0:
        raise ValueError("Os valores de sódio devem ser maiores que zero.")
    if urine_creatinine_mg_dl <= 0 or plasma_creatinine_mg_dl <= 0:
        raise ValueError("Os valores de creatinina devem ser maiores que zero.")
    fena = (urine_sodium_meq_l * plasma_creatinine_mg_dl) / (plasma_sodium_meq_l * urine_creatinine_mg_dl) * 100.0
    return fena


def example() -> Dict[str, float]:
    """Exemplo de uso da calculadora de FeNa.

    Returns:
        dict: Entradas e resultado.
    """
    U_Na = 40.0
    P_Na = 140.0
    U_Cr = 100.0
    P_Cr = 1.2
    fena = calculate_fena(U_Na, P_Na, U_Cr, P_Cr)
    return {"Na_urina": U_Na, "Na_sangue": P_Na, "Cr_urina": U_Cr, "Cr_sangue": P_Cr, "FeNa_percentual": fena}

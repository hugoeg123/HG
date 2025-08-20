"""
Calculadora de glicemia média estimada (eAG) a partir da HbA1c.

A glicemia média estimada converte a hemoglobina glicada (HbA1c) em uma média
aproximada de glicemia nos últimos meses.  A relação linear derivada pelo
ADAG (A1c-Derived Average Glucose) Study é:

    eAG (mg/dL) = 28,7 × HbA1c (%) – 46,7

Referência: artigo explicativo sobre eAG【799159143955111†L235-L241】.
"""

from typing import Dict


def calculate_eag(hba1c_percent: float) -> float:
    """Converte HbA1c (%) para glicemia média estimada (eAG) em mg/dL.

    Args:
        hba1c_percent: Hemoglobina glicada em percentagem (0–100).

    Returns:
        float: eAG em mg/dL.

    Raises:
        ValueError: se o valor de HbA1c não estiver em um intervalo plausível.
    """
    if hba1c_percent <= 0 or hba1c_percent > 20:
        raise ValueError("HbA1c deve estar entre 0 e 20% para uma conversão válida.")
    return 28.7 * hba1c_percent - 46.7


def example() -> Dict[str, float]:
    """Exemplo de uso da eAG.

    Returns:
        dict: Entradas e eAG calculada.
    """
    hba1c = 7.0  # %
    eag = calculate_eag(hba1c)
    return {"HbA1c": hba1c, "eAG_mg_dl": eag}

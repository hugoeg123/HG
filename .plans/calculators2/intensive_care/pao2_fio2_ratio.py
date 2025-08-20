"""PaO2/FiO2 ratio calculator.

The PaO2/FiO2 ratio (P/F ratio) is used to assess the severity of acute
respiratory distress syndrome (ARDS) and to guide ventilatory strategies.

Formula:
    P/F ratio = PaO2 (mmHg) / FiO2 (decimal)

where FiO2 is expressed as a fraction (e.g., 0.21 for room air).

Inputs
------
pao2_mm_hg : float
    Partial pressure of arterial oxygen (mmHg).
fio2 : float
    Fraction of inspired oxygen (0–1).

Returns
-------
float
    PaO2/FiO2 ratio.
"""

from __future__ import annotations


def calculate_pao2_fio2_ratio(pao2_mm_hg: float, fio2: float) -> float:
    """Compute the PaO2/FiO2 ratio.

    Parameters
    ----------
    pao2_mm_hg : float
        Arterial oxygen partial pressure in mmHg.
    fio2 : float
        Fraction of inspired oxygen (0–1).

    Returns
    -------
    float
        The P/F ratio.

    Raises
    ------
    ValueError
        If FiO2 is zero or negative, or PaO2 is negative.
    """
    if fio2 <= 0 or fio2 > 1:
        raise ValueError("FiO2 must be between 0 and 1")
    if pao2_mm_hg < 0:
        raise ValueError("PaO2 cannot be negative")
    return pao2_mm_hg / fio2


def example() -> float:
    """Example P/F ratio calculation.

    Returns
    -------
    float
        P/F ratio for PaO2 80 mmHg on 0.40 FiO2.
    """
    return calculate_pao2_fio2_ratio(pao2_mm_hg=80, fio2=0.40)


__all__ = ["calculate_pao2_fio2_ratio", "example"]
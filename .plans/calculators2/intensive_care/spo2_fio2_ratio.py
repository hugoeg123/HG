"""SpO2/FiO2 ratio calculator.

The SpO2/FiO2 ratio (S/F ratio) approximates the PaO2/FiO2 ratio when
arterial blood gases are not available.  SpO2 is expressed as a fraction
(e.g., 0.94 for 94%).  Some studies propose conversions between S/F and P/F.

Formula:
    S/F ratio = SpO2 (fraction) / FiO2 (fraction)

Inputs
------
spo2 : float
    Peripheral oxygen saturation as a fraction (0–1).
fio2 : float
    Fraction of inspired oxygen (0–1).

Returns
-------
float
    SpO2/FiO2 ratio (dimensionless).

Raises
------
ValueError
    If FiO2 is zero or out of range, or SpO2 is out of range.
"""

from __future__ import annotations


def calculate_spo2_fio2_ratio(spo2: float, fio2: float) -> float:
    """Compute the SpO2/FiO2 ratio.

    Parameters
    ----------
    spo2 : float
        Peripheral oxygen saturation (0–1).
    fio2 : float
        Fraction of inspired oxygen (0–1).

    Returns
    -------
    float
        SpO2/FiO2 ratio.

    Raises
    ------
    ValueError
        If inputs are invalid.
    """
    if not (0 <= spo2 <= 1):
        raise ValueError("SpO2 must be between 0 and 1")
    if fio2 <= 0 or fio2 > 1:
        raise ValueError("FiO2 must be between 0 and 1")
    return spo2 / fio2


def example() -> float:
    """Example S/F ratio calculation.

    Returns
    -------
    float
        Example SpO2/FiO2 for SpO2 0,95 and FiO2 0,5.
    """
    return calculate_spo2_fio2_ratio(spo2=0.95, fio2=0.50)


__all__ = ["calculate_spo2_fio2_ratio", "example"]
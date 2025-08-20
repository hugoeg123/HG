"""Fractional excretion of urea (FeUrea) calculator.

FeUrea is used to differentiate prerenal azotemia from intrinsic renal causes when
patients are receiving diuretics.  It is similar to the fractional excretion
of sodium but uses urea concentrations.

Formula:
    FeUrea (%) = [(U_urea × P_creatinina) / (P_urea × U_creatinina)] × 100

Inputs
------
urine_urea : float
    Urea concentration in urine (mg/dL).
plasma_urea : float
    Urea concentration in plasma (mg/dL).
urine_creatinine : float
    Creatinine concentration in urine (mg/dL).
plasma_creatinine : float
    Creatinine concentration in plasma (mg/dL).

Returns
-------
FractionalExcretionUreaResult
    Data class containing fractional excretion of urea (percentage).

Reference
---------
The formula for fractional excretion of urea mirrors that of sodium,
substituting urea concentrations for sodium.  It is commonly used in
patients receiving diuretics.
"""

from __future__ import annotations
from dataclasses import dataclass


@dataclass
class FractionalExcretionUreaResult:
    """Result of fractional excretion of urea calculation."""

    feu_percent: float  # percent


def calculate_fractional_excretion_urea(
    urine_urea: float,
    plasma_urea: float,
    urine_creatinine: float,
    plasma_creatinine: float,
) -> FractionalExcretionUreaResult:
    """Compute the fractional excretion of urea.

    Parameters
    ----------
    urine_urea : float
        Urea concentration in urine (mg/dL).
    plasma_urea : float
        Urea concentration in plasma (mg/dL).
    urine_creatinine : float
        Creatinine concentration in urine (mg/dL).
    plasma_creatinine : float
        Creatinine concentration in plasma (mg/dL).

    Returns
    -------
    FractionalExcretionUreaResult
        Data class with fractional excretion of urea as a percentage.

    Raises
    ------
    ValueError
        If any concentration is non-positive.
    """
    for value in [urine_urea, plasma_urea, urine_creatinine, plasma_creatinine]:
        if value <= 0:
            raise ValueError("All concentrations must be positive")

    feu = ((urine_urea * plasma_creatinine) / (plasma_urea * urine_creatinine)) * 100.0
    return FractionalExcretionUreaResult(feu_percent=feu)


def example() -> float:
    """Example calculation for fractional excretion of urea.

    Returns
    -------
    float
        Example FeUrea (%) for typical concentrations.
    """
    result = calculate_fractional_excretion_urea(
        urine_urea=300,
        plasma_urea=30,
        urine_creatinine=100,
        plasma_creatinine=1.0,
    )
    return result.feu_percent


__all__ = [
    "calculate_fractional_excretion_urea",
    "FractionalExcretionUreaResult",
    "example",
]
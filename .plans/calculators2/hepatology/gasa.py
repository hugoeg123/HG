"""Serum–ascites albumin gradient (SAAG/GASA) calculator.

The serum–ascites albumin gradient (SAAG), called GASA in Portuguese,
helps differentiate portal hypertensive ascites from other causes.

Formula:
    SAAG = albumin_serum − albumin_ascitic_fluid

Inputs
------
albumin_serum : float
    Serum albumin concentration in g/dL.
albumin_ascitic : float
    Albumin concentration in ascitic fluid (g/dL).

Returns
-------
SAAGResult
    Data class containing the SAAG in g/dL.

Interpretation
--------------
SAAG ≥ 1,1 g/dL sugere hipertensão portal; valores menores sugerem ascite de causa não portal【351396793089184†L158-L159】.
"""

from __future__ import annotations
from dataclasses import dataclass


@dataclass
class SAAGResult:
    """Result of SAAG calculation."""

    saag: float  # g/dL


def calculate_saag(albumin_serum: float, albumin_ascitic: float) -> SAAGResult:
    """Compute the serum–ascites albumin gradient.

    Parameters
    ----------
    albumin_serum : float
        Albumin concentration in serum (g/dL).
    albumin_ascitic : float
        Albumin concentration in ascitic fluid (g/dL).

    Returns
    -------
    SAAGResult
        Data class containing the gradient (g/dL).

    Raises
    ------
    ValueError
        If any albumin concentration is negative.
    """
    if albumin_serum < 0 or albumin_ascitic < 0:
        raise ValueError("Albumin concentrations must be non-negative")
    saag = albumin_serum - albumin_ascitic
    return SAAGResult(saag=saag)


def example() -> float:
    """Example calculation of SAAG.

    Returns
    -------
    float
        SAAG for serum albumin 3,5 g/dL and ascitic albumin 1,8 g/dL.
    """
    result = calculate_saag(albumin_serum=3.5, albumin_ascitic=1.8)
    return result.saag


__all__ = ["calculate_saag", "SAAGResult", "example"]
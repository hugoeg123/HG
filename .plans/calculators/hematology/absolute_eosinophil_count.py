"""Absolute eosinophil count calculator.

This module provides a function to calculate the absolute eosinophil count
from a white blood cell count and the percentage of eosinophils present.

Formula:
    absolute_count = (white_blood_cells * eosinophil_percentage) / 100

Inputs
------
white_blood_cells : float
    Total white blood cell count (e.g., cells/µL).
eosinophil_percentage : float
    Percentage of eosinophils in the differential count (0–100%).

Output
------
absolute_count : float
    Absolute eosinophil count (cells/µL).

Reference
---------
The absolute eosinophil count is obtained by multiplying the total white blood
cell count by the percentage of eosinophils【14686014660818†L137-L140】.
"""

from __future__ import annotations
from dataclasses import dataclass


@dataclass
class AbsoluteEosinophilCountResult:
    """Result of absolute eosinophil count calculation."""

    absolute_count: float  # cells/µL


def calculate_absolute_eosinophil_count(
    white_blood_cells: float,
    eosinophil_percentage: float,
) -> AbsoluteEosinophilCountResult:
    """Compute the absolute eosinophil count.

    Parameters
    ----------
    white_blood_cells : float
        Total white blood cell count (cells/µL).
    eosinophil_percentage : float
        Percentage of eosinophils in the differential (0–100).

    Returns
    -------
    AbsoluteEosinophilCountResult
        Data class containing the absolute eosinophil count in cells/µL.

    Raises
    ------
    ValueError
        If the eosinophil percentage is outside 0–100 or if cell counts are negative.
    """
    if white_blood_cells < 0:
        raise ValueError("white_blood_cells must be non-negative")
    if not (0 <= eosinophil_percentage <= 100):
        raise ValueError("eosinophil_percentage must be between 0 and 100")

    absolute_count = (white_blood_cells * eosinophil_percentage) / 100.0
    return AbsoluteEosinophilCountResult(absolute_count=absolute_count)


def example() -> float:
    """Example calculation using typical values.

    Returns
    -------
    float
        Absolute eosinophil count for 7,000 WBC and 4% eosinophils.
    """
    result = calculate_absolute_eosinophil_count(white_blood_cells=7000, eosinophil_percentage=4)
    return result.absolute_count


__all__ = ["calculate_absolute_eosinophil_count", "AbsoluteEosinophilCountResult", "example"]
"""Measured creatinine clearance calculation.

This module provides a function to compute the measured creatinine clearance
from urine collection data.  It is typically used when a timed urine sample
is available and yields a more accurate assessment of glomerular filtration
than estimation formulas.

Formula:
    CrCl (mL/min) = (urine_creatinine * urine_volume) / (serum_creatinine * collection_time) × correction

where:
    - urine_creatinine is expressed in mg/dL or mmol/L (must match serum units).
    - urine_volume is in mL collected over collection_time (minutes).
    - serum_creatinine is the plasma concentration (same units as urine_creatinine).
    - collection_time is the duration of the urine collection in minutes.
    - correction adjusts for unit conversion (e.g., mg/dL to mg/mL, time scaling).

For mg/dL units: CrCl = (U_Cr (mg/dL) × U_vol (mL) × (1 dL/100 mL)) / (P_Cr (mg/dL) × t (min))
and yields mL/min.

Inputs
------
urine_creatinine : float
    Concentration of creatinine in urine (e.g. mg/dL).
urine_volume : float
    Total volume of urine collected (mL).
serum_creatinine : float
    Serum creatinine concentration (same units as urine_creatinine).
collection_time : float
    Duration of the urine collection in minutes.

Returns
-------
MeasuredCreatinineClearanceResult
    Data class containing creatinine clearance in mL/min.

Reference
---------
See clinical chemistry textbooks for the standard formula for measured creatinine clearance.
"""

from __future__ import annotations
from dataclasses import dataclass


@dataclass
class MeasuredCreatinineClearanceResult:
    """Result of measured creatinine clearance calculation."""

    clearance_ml_min: float  # mL/min


def calculate_measured_creatinine_clearance(
    urine_creatinine: float,
    urine_volume: float,
    serum_creatinine: float,
    collection_time: float,
) -> MeasuredCreatinineClearanceResult:
    """Calculate the measured creatinine clearance.

    Parameters
    ----------
    urine_creatinine : float
        Concentration of creatinine in the urine (mg/dL or similar).
    urine_volume : float
        Total volume of urine collected over the interval (mL).
    serum_creatinine : float
        Serum creatinine concentration (same units as urine_creatinine).
    collection_time : float
        Duration of urine collection in minutes.

    Returns
    -------
    MeasuredCreatinineClearanceResult
        Data class with the creatinine clearance in mL/min.

    Raises
    ------
    ValueError
        If any numeric input is negative or zero.
    """
    if urine_creatinine <= 0 or serum_creatinine <= 0:
        raise ValueError("Creatinine concentrations must be positive")
    if urine_volume < 0 or collection_time <= 0:
        raise ValueError("Volume must be non-negative and collection_time must be positive")

    # Convert urine_creatinine from mg/dL to mg/mL by dividing by 100
    # Equivalent to multiply by 1 dL/100 mL to cancel units.
    # clearance (mL/min) = (urine_creatinine * urine_volume / 100) / (serum_creatinine * collection_time)
    clearance = (urine_creatinine * (urine_volume / 100.0)) / (serum_creatinine * collection_time)
    return MeasuredCreatinineClearanceResult(clearance_ml_min=clearance)


def example() -> float:
    """Example calculation of measured creatinine clearance.

    Returns
    -------
    float
        Clearance in mL/min for a urine sample with 100 mg/dL creatinine,
        total volume 1500 mL over 24 h (1440 min), and plasma creatinine 1 mg/dL.
    """
    result = calculate_measured_creatinine_clearance(
        urine_creatinine=100,
        urine_volume=1500,
        serum_creatinine=1.0,
        collection_time=1440,
    )
    return result.clearance_ml_min


__all__ = [
    "calculate_measured_creatinine_clearance",
    "MeasuredCreatinineClearanceResult",
    "example",
]
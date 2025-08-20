"""Conversion between micrograms per kilogram per minute and mL/h for infusions.

Many vasoactive and sedative drugs are prescribed based on weight (mcg/kg/min) but
infusion pumps operate in mL/h.  This module converts between these units
given the patient's weight and the drug concentration in the infusion.

To convert from mcg/kg/min to mL/h:
    mL/h = (dose_mcg_per_kg_min × weight_kg × 60) / (concentration_mg_per_ml × 1000)

To convert from mL/h to mcg/kg/min:
    mcg/kg/min = (rate_ml_h × concentration_mg_per_ml × 1000) / (weight_kg × 60)

Inputs
------
dose_mcg_per_kg_min : float
    Dose of drug in mcg/kg/min (when converting to mL/h).
rate_ml_h : float
    Rate of infusion in mL/h (when converting to mcg/kg/min).
weight_kg : float
    Patient weight in kilograms.
concentration_mg_per_ml : float
    Drug concentration in mg/mL.

Only one of `dose_mcg_per_kg_min` or `rate_ml_h` should be provided at a time.

Returns
-------
float
    Either the infusion rate in mL/h or the dose in mcg/kg/min, depending on the input.

Raises
------
ValueError
    If both or neither of `dose_mcg_per_kg_min` and `rate_ml_h` are provided, or if weight or concentration are non‑positive.
"""

from __future__ import annotations

from typing import Optional


def convert_mcgkgmin_to_mlh(
    *,
    dose_mcg_per_kg_min: Optional[float] = None,
    rate_ml_h: Optional[float] = None,
    weight_kg: float,
    concentration_mg_per_ml: float,
) -> float:
    """Convert between mcg/kg/min and mL/h.

    Exactly one of `dose_mcg_per_kg_min` or `rate_ml_h` must be provided.

    Parameters
    ----------
    dose_mcg_per_kg_min : float, optional
        Infusion dose expressed in microgramas por quilo por minuto.
    rate_ml_h : float, optional
        Infusion rate expressed in mL/h.
    weight_kg : float
        Patient weight in kilograms.
    concentration_mg_per_ml : float
        Concentration of the drug solution in mg/mL.

    Returns
    -------
    float
        The converted value: mL/h if `dose_mcg_per_kg_min` is given, or mcg/kg/min if `rate_ml_h` is given.

    Raises
    ------
    ValueError
        If input parameters are invalid.
    """
    if weight_kg <= 0 or concentration_mg_per_ml <= 0:
        raise ValueError("weight_kg and concentration_mg_per_ml must be positive")

    if (dose_mcg_per_kg_min is None and rate_ml_h is None) or (
        dose_mcg_per_kg_min is not None and rate_ml_h is not None
    ):
        raise ValueError(
            "Provide exactly one of dose_mcg_per_kg_min or rate_ml_h"
        )

    if dose_mcg_per_kg_min is not None:
        # Convert mcg/kg/min to mL/h
        mL_per_h = (
            dose_mcg_per_kg_min * weight_kg * 60.0 / (concentration_mg_per_ml * 1000.0)
        )
        return mL_per_h
    else:
        # Convert mL/h to mcg/kg/min
        mcg_kg_min = (
            rate_ml_h * concentration_mg_per_ml * 1000.0 / (weight_kg * 60.0)
        )
        return mcg_kg_min


def example_conversion() -> tuple[float, float]:
    """Example conversions for a typical infusion.

    Returns
    -------
    tuple[float, float]
        mL/h rate for a dose of 5 mcg/kg/min in a 70 kg patient with 1 mg/mL concentration, and
        mcg/kg/min dose for 20 mL/h infusion in the same patient.
    """
    mlh = convert_mcgkgmin_to_mlh(
        dose_mcg_per_kg_min=5,
        weight_kg=70,
        concentration_mg_per_ml=1,
    )
    mcgkgmin = convert_mcgkgmin_to_mlh(
        rate_ml_h=20,
        weight_kg=70,
        concentration_mg_per_ml=1,
    )
    return mlh, mcgkgmin


__all__ = ["convert_mcgkgmin_to_mlh", "example_conversion"]
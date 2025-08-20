"""Calculadoras de terapia intensiva e emergência.

Este pacote reúne funções para cálculos de terapia intensiva, incluindo
relações gasométricas e estimativas de PaO₂ ideal.
"""

from .ideal_pao2 import calculate_ideal_pao2
from .pao2_fio2_ratio import calculate_pao2_fio2_ratio
from .spo2_fio2_ratio import calculate_spo2_fio2_ratio

__all__ = [
    "calculate_ideal_pao2",
    "calculate_pao2_fio2_ratio",
    "calculate_spo2_fio2_ratio",
]
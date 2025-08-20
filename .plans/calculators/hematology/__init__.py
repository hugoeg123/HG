"""Pacote com calculadoras de hematologia e coagulação.

Inclui cálculos de déficit de ferro, saturação de transferrina e contagem absoluta de eosinófilos.
"""

from .iron_deficit import calculate_iron_deficit
from .transferrin_saturation import calculate_transferrin_saturation
from .absolute_eosinophil_count import calculate_absolute_eosinophil_count

__all__ = [
    "calculate_iron_deficit",
    "calculate_transferrin_saturation",
    "calculate_absolute_eosinophil_count",
]
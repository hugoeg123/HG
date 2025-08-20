"""
Conversor entre gotas por minuto e mililitros por hora.

Usa o número de gotas registradas, o tempo de contagem (em segundos) e a relação de gotas por mililitro do equipo para calcular a taxa de infusão em mL/h.  Também permite a conversão inversa.
"""

from typing import Dict

def drops_to_ml_per_hour(drops: int, time_seconds: float, drops_per_ml: float) -> float:
    """Converte gotas/minuto em mL/h.

    Args:
        drops: Número de gotas contadas.
        time_seconds: Tempo em segundos durante o qual as gotas foram contadas.
        drops_per_ml: Relação de gotas por mililitro do equipo.

    Returns:
        float: Taxa de infusão em mL por hora.

    Raises:
        ValueError: se algum argumento for não positivo.
    """
    if drops <= 0:
        raise ValueError("O número de gotas deve ser maior que zero.")
    if time_seconds <= 0:
        raise ValueError("O tempo deve ser maior que zero.")
    if drops_per_ml <= 0:
        raise ValueError("A relação gotas/mL deve ser maior que zero.")
    drops_per_min = drops / (time_seconds / 60.0)
    ml_per_hour = (drops_per_min / drops_per_ml) * 60.0
    return ml_per_hour


def ml_per_hour_to_drops(rate_ml_per_hour: float, drops_per_ml: float) -> float:
    """Converte mL/h em gotas/min.

    Args:
        rate_ml_per_hour: Taxa de infusão em mL/h.
        drops_per_ml: Relação de gotas por mililitro.

    Returns:
        float: Gotas por minuto.

    Raises:
        ValueError: se algum argumento for não positivo.
    """
    if rate_ml_per_hour <= 0:
        raise ValueError("A taxa de infusão deve ser maior que zero.")
    if drops_per_ml <= 0:
        raise ValueError("A relação gotas/mL deve ser maior que zero.")
    drops_per_min = (rate_ml_per_hour / 60.0) * drops_per_ml
    return drops_per_min


def example() -> Dict[str, float]:
    """Exemplo de conversão de gotas para mL/h e vice‑versa.

    Returns:
        dict: Valores de entrada e resultados.
    """
    drops = 20
    time_sec = 30.0
    ratio = 20.0
    ml_h = drops_to_ml_per_hour(drops, time_sec, ratio)
    drops_min = ml_per_hour_to_drops(ml_h, ratio)
    return {"drops": drops, "time_s": time_sec, "drops_per_ml": ratio, "ml_h": ml_h, "drops_min_calculated": drops_min}

"""
Correção de sódio em hiperglicemia.

Pacientes hiperglicêmicos podem apresentar natremia falsamente reduzida em decorrência de
um deslocamento osmótico de água.  A fórmula de Katz corrige o sódio sérico com base
na glicemia:

    Na_corr = Na_medido + 1,6 × [(glicemia – 100) / 100]

Outras referências utilizam um fator de 2,4 em vez de 1,6.  Esta função implementa
o fator padrão de 1,6 e permite ajuste opcional.

Referência: FP Notebook – correção da natremia em hiperglicemia【997213102652314†L43-L53】.
"""

from typing import Dict


def calculate_corrected_sodium(sodium_measured_mEq_L: float, glucose_mg_dl: float, factor: float = 1.6) -> float:
    """Calcula a natremia corrigida para hiperglicemia.

    Args:
        sodium_measured_mEq_L: Sódio sérico medido, em mEq/L.
        glucose_mg_dl: Glicemia em mg/dL.
        factor: Fator de correção por incremento de 100 mg/dL de glicose acima de 100 mg/dL (1.6 ou 2.4).

    Returns:
        float: Sódio corrigido em mEq/L.

    Raises:
        ValueError: se o sódio ou glicose forem negativos, ou se o fator for não positivo.
    """
    if sodium_measured_mEq_L <= 0 or glucose_mg_dl < 0:
        raise ValueError("Sódio e glicemia devem ser valores não negativos; o sódio deve ser positivo.")
    if factor <= 0:
        raise ValueError("O fator de correção deve ser positivo.")
    # Apenas corrige se a glicemia estiver acima de 100 mg/dL
    if glucose_mg_dl <= 100:
        return sodium_measured_mEq_L
    increment = (glucose_mg_dl - 100) / 100
    return sodium_measured_mEq_L + factor * increment


def example() -> Dict[str, float]:
    """Exemplo de uso da correção de sódio.

    Returns:
        dict: Entradas e sódio corrigido.
    """
    sodium = 130.0  # mEq/L
    glucose = 400.0  # mg/dL
    corrected = calculate_corrected_sodium(sodium, glucose)
    return {"sodio_medido": sodium, "glicemia": glucose, "sodio_corrigido": corrected}

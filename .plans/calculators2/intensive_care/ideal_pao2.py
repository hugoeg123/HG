"""
Calculadora de PaO₂ ideal com base na idade.

A pressão parcial de oxigênio (PaO₂) ideal diminui com a idade.  Uma regra
aproximada usa a fórmula:

    PaO₂ ideal = 100 – (idade/3)

Outra fonte utiliza a relação 109 – 0,43 × idade【980761630100207†L261-L263】.  Esta
implementação utiliza o método `100 – idade/3` por padrão, porém permite que o
usuário escolha a fórmula.
"""

from typing import Dict


def calculate_ideal_pao2(age_years: float, method: str = "100_age_div_3") -> float:
    """Calcula a PaO₂ ideal para um determinado método.

    Args:
        age_years: Idade em anos.
        method: Método de cálculo: '100_age_div_3' (default) usa 100 – idade/3;
            '109_minus_0.43_age' usa 109 – 0,43 × idade.

    Returns:
        float: PaO₂ ideal em mmHg.

    Raises:
        ValueError: se idade for negativa ou método desconhecido.
    """
    if age_years < 0:
        raise ValueError("Idade não pode ser negativa.")
    method = method.lower()
    if method == "100_age_div_3":
        return 100.0 - (age_years / 3.0)
    elif method == "109_minus_0.43_age":
        return 109.0 - 0.43 * age_years
    else:
        raise ValueError("Método desconhecido: escolha '100_age_div_3' ou '109_minus_0.43_age'.")


def example() -> Dict[str, float]:
    """Exemplo de uso da PaO₂ ideal.

    Returns:
        dict: Entradas e resultados para ambos os métodos.
    """
    age = 60.0  # anos
    pao2_100 = calculate_ideal_pao2(age)
    pao2_109 = calculate_ideal_pao2(age, method="109_minus_0.43_age")
    return {"idade": age, "PaO2_100_idade/3": pao2_100, "PaO2_109_0.43": pao2_109}

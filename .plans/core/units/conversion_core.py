"""
Módulo central de conversão de unidades e analitos.

Este módulo carrega definições de unidades e analitos a partir de arquivos JSON
e oferece funções para normalização de unidades, conversão de valores e listagem
de unidades e analitos.  A conversão usa o Sistema Internacional internamente e
fatores específicos por analito quando necessário.
"""

import json
import os
from pathlib import Path
from typing import Optional, Dict, Any, List

# Caminhos para os arquivos JSON
_BASE_DIR = Path(__file__).resolve().parent.parent
_UNITS_FILE = _BASE_DIR / "units" / "units.factors.json"
_UNIT_SYNONYMS_FILE = _BASE_DIR / "units" / "units.synonyms.json"
_ANALYTES_FILE = _BASE_DIR / "analytes" / "analytes.catalog.json"
_ANALYTE_SYNONYMS_FILE = _BASE_DIR / "analytes" / "analytes.synonyms.json"

_units_data: Dict[str, Any] = {}
_unit_synonyms: Dict[str, List[str]] = {}
_analytes: List[Dict[str, Any]] = []
_analyte_synonyms: Dict[str, str] = {}


def _load_data() -> None:
    """Carrega dados de unidades e analitos a partir dos arquivos JSON (singleton)."""
    global _units_data, _unit_synonyms, _analytes, _analyte_synonyms
    if _units_data:
        return
    # Carrega unidades
    with open(_UNITS_FILE, "r", encoding="utf-8") as f:
        _units_data = json.load(f)
    # Carrega sinônimos de unidades
    with open(_UNIT_SYNONYMS_FILE, "r", encoding="utf-8") as f:
        synonyms_map = json.load(f)
    # Cria mapa reverso para normalização
    _unit_synonyms = {}
    for canonical, syns in synonyms_map.items():
        for s in syns:
            _unit_synonyms[s.lower()] = canonical
        _unit_synonyms[canonical.lower()] = canonical
    # Carrega analitos
    with open(_ANALYTES_FILE, "r", encoding="utf-8") as f:
        _analytes = json.load(f)
    # Carrega sinônimos de analitos
    with open(_ANALYTE_SYNONYMS_FILE, "r", encoding="utf-8") as f:
        syns = json.load(f)
    _analyte_synonyms = {k.lower(): v for k, v in syns.items()}


def normalize_unit(u: str) -> str:
    """Normaliza uma unidade utilizando o mapa de sinônimos.

    Args:
        u: unidade informada (ex.: "mcg", "mg/dl", "u/l").

    Returns:
        Unidade canônica (ex.: "µg", "mg/dL") caso conhecida; caso contrário, devolve
        a unidade original.
    """
    _load_data()
    if not isinstance(u, str):
        raise TypeError("unidade deve ser string")
    key = u.strip().lower()
    return _unit_synonyms.get(key, u)


def _find_analyte(key_or_name: str) -> Optional[Dict[str, Any]]:
    """Obtém o dicionário de um analito a partir de sua chave ou sinônimo.

    Args:
        key_or_name: chave ou nome/sinônimo do analito.

    Returns:
        Dicionário do analito ou None.
    """
    if key_or_name is None:
        return None
    _load_data()
    key_lower = key_or_name.lower()
    # Verifica se é exatamente a key
    for a in _analytes:
        if a["key"] == key_lower:
            return a
    # Verifica sinônimos
    canonical = _analyte_synonyms.get(key_lower)
    if canonical:
        for a in _analytes:
            if a["key"] == canonical:
                return a
    # Verifica por nome completo
    for a in _analytes:
        names = [n.lower() for n in a.get("names", [])]
        if key_lower in names:
            return a
    return None


def get_analyte(key_or_name: str) -> Dict[str, Any]:
    """Retorna o objeto de analito correspondente.

    Args:
        key_or_name: chave ou sinônimo de analito.

    Raises:
        KeyError se o analito não for encontrado.
    """
    analito = _find_analyte(key_or_name)
    if not analito:
        raise KeyError(f"Analito não encontrado: {key_or_name}")
    return analito


def list_units() -> Dict[str, Any]:
    """Lista todas as unidades canônicas e seus metadados."""
    _load_data()
    return _units_data["units"]


def list_analytes(category: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retorna a lista de analitos, opcionalmente filtrando por categoria."""
    _load_data()
    if category is None:
        return list(_analytes)
    category_lower = category.lower()
    return [a for a in _analytes if a.get("category") == category_lower]


def _apply_canonical_conversion(value: float, from_unit: str, to_unit: str, analyte: Dict[str, Any]) -> Optional[float]:
    """Aplica fator de conversão canônico definido no catálogo do analito.

    Retorna o valor convertido se existir um fator canônico definido; caso contrário
    retorna None.
    """
    if analyte is None:
        return None
    for conv in analyte.get("canonical_conversions", []):
        if conv["from"].lower() == from_unit.lower() and conv["to"].lower() == to_unit.lower():
            return value * conv["factor"]
        if conv["to"].lower() == from_unit.lower() and conv["from"].lower() == to_unit.lower():
            # Fator inverso
            return value / conv["factor"]
    return None


def convert_value(value: float, from_unit: str, to_unit: str,
                  analyte: Optional[str] = None, valence: Optional[int] = None) -> float:
    """Converte um valor de uma unidade para outra.

    Caso as unidades pertençam à mesma dimensão, aplica o fator de base.  Para
    conversões entre concentrações de massa por volume e concentrações de
    substância por volume, utiliza o fator canônico do analito ou massa
    molar/valência para transformar.

    Args:
        value: valor numérico a converter.
        from_unit: unidade de origem.
        to_unit: unidade de destino.
        analyte: (opcional) chave ou sinônimo de analito quando a conversão depende de massa molar ou fator canônico.
        valence: (opcional) valência do íon; se não fornecido utiliza o valor do analito quando aplicável.

    Returns:
        Valor convertido.

    Raises:
        ValueError: para combinações de unidades incompatíveis.
    """
    _load_data()
    if from_unit == to_unit:
        return value
    # Normaliza unidades
    from_c = normalize_unit(from_unit)
    to_c = normalize_unit(to_unit)
    # Tenta usar fator canônico do analito
    analito_obj = _find_analyte(analyte) if analyte else None
    canonical = _apply_canonical_conversion(value, from_c, to_c, analito_obj)
    if canonical is not None:
        return canonical
    # Obtém metadados de unidades
    units = _units_data["units"]
    if from_c not in units or to_c not in units:
        raise ValueError(f"Unidades desconhecidas ou não compatíveis: {from_c} → {to_c}")
    dim_from = units[from_c]["dimension"]
    dim_to = units[to_c]["dimension"]
    # Se são da mesma dimensão, usa base
    if dim_from == dim_to:
        factor_from = units[from_c]["to_base"]
        factor_to = units[to_c]["to_base"]
        return value * (factor_from / factor_to)
    # Conversão entre mEq e mmol: requer valência
    if {dim_from, dim_to} == {"conc_substance_vol", "conc_substance_vol"} and ("mEq/L" in [from_c, to_c]):
        # Exige analito ou valence
        val = valence
        if val is None and analito_obj is not None:
            val = analito_obj.get("valence")
        if val is None or val == 0:
            raise ValueError("Valência necessária para mEq↔mmol")
        if from_c == "mEq/L" and to_c == "mmol/L":
            return value / abs(val)
        if from_c == "mmol/L" and to_c == "mEq/L":
            return value * abs(val)
    # Conversão entre mg/dL (conc_mass_vol) e mmol/L (conc_substance_vol) sem fator canônico
    # Usa massa molar do analito se disponível
    if dim_from == "conc_mass_vol" and dim_to == "conc_substance_vol":
        if analito_obj is None or analito_obj.get("molar_mass_g_per_mol", 0) == 0:
            raise ValueError("Conversão de concentração de massa para substância requer analito com massa molar")
        # converte mg/dL para g/L: mg/dL × 10 (dL→L) × 1e-3 (mg→g) = ×0.01
        g_per_L = value * 0.01
        # converte g/L para mol/L: divide pela massa molar (g/mol)
        mol_per_L = g_per_L / analito_obj["molar_mass_g_per_mol"]
        # Converte mol/L para mmol/L
        mmol_per_L = mol_per_L * 1000.0
        # Ajuste de valência para mEq
        if to_c == "mEq/L":
            val = valence or analito_obj.get("valence") or 1
            return mmol_per_L * abs(val)
        return mmol_per_L
    if dim_from == "conc_substance_vol" and dim_to == "conc_mass_vol":
        if analito_obj is None or analito_obj.get("molar_mass_g_per_mol", 0) == 0:
            raise ValueError("Conversão de substância para massa requer analito com massa molar")
        # converte unidade de substância para mol/L
        if from_c in ("mmol/L", "µmol/L", "nmol/L", "pmol/L"):
            factor_from = units[from_c]["to_base"]  # conversão para mol/L
            mol_per_L = value * factor_from
        elif from_c == "mEq/L":
            # mEq/L → mmol/L considerando valência
            val = valence or analito_obj.get("valence") or 1
            mmol_per_L = value / abs(val)
            mol_per_L = mmol_per_L / 1000.0
        else:
            mol_per_L = value  # assume já em mol/L
        g_per_L = mol_per_L * analito_obj["molar_mass_g_per_mol"]
        # g/L para mg/dL: g/L ×100 (L→dL) ×1000 (g→mg) = ×100000?  incorreto: 1 g/L = 100 mg/dL?  g→mg ×1000; L→dL divide 10 => 100; portanto ×100
        mg_per_dL = g_per_L * 100
        return mg_per_dL
    raise ValueError(f"Conversão não suportada: {from_c} → {to_c}")

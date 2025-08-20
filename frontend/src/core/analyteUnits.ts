import analytesData from '../data/analytes.json';

export interface AnalyteUnit {
  name: string;
  symbol: string;
  isSI: boolean;
  conversionFactor: number;
  precision: number;
}

export interface Analyte {
  name: string;
  symbol: string;
  units: AnalyteUnit[];
  referenceRanges: Array<{
    population: string;
    unit: string;
    range: {
      min?: number;
      max?: number;
    };
  }>;
}

export interface AnalyteFamily {
  name: string;
  description: string;
  analytes: Record<string, Analyte>;
}

export interface AnalyteCatalog {
  families: Record<string, AnalyteFamily>;
}

// Type-safe access to analytes data
const catalog: AnalyteCatalog = analytesData as AnalyteCatalog;

/**
 * Convert a value from one unit to another for a specific analyte
 * @param analyteId - The analyte identifier (e.g., 'glucose', 'sodium')
 * @param familyId - The family identifier (e.g., 'metabolites', 'electrolytes')
 * @param value - The numeric value to convert
 * @param fromUnit - The source unit symbol
 * @param toUnit - The target unit symbol
 * @returns The converted value or null if conversion is not possible
 */
export function convertAnalyteUnit(
  analyteId: string,
  familyId: string,
  value: number,
  fromUnit: string,
  toUnit: string
): number | null {
  const family = catalog.families[familyId];
  if (!family) return null;

  const analyte = family.analytes[analyteId];
  if (!analyte) return null;

  const fromUnitData = analyte.units.find(u => u.symbol === fromUnit);
  const toUnitData = analyte.units.find(u => u.symbol === toUnit);

  if (!fromUnitData || !toUnitData) return null;

  // Convert to base unit first, then to target unit
  const baseValue = value / fromUnitData.conversionFactor;
  const convertedValue = baseValue * toUnitData.conversionFactor;

  // Apply precision
  return Number(convertedValue.toFixed(toUnitData.precision));
}

/**
 * Get all available units for a specific analyte
 * @param analyteId - The analyte identifier
 * @param familyId - The family identifier
 * @returns Array of available units or empty array if not found
 */
export function getAnalyteUnits(analyteId: string, familyId: string): AnalyteUnit[] {
  const family = catalog.families[familyId];
  if (!family) return [];

  const analyte = family.analytes[analyteId];
  if (!analyte) return [];

  return analyte.units;
}

/**
 * Get reference ranges for a specific analyte
 * @param analyteId - The analyte identifier
 * @param familyId - The family identifier
 * @param population - Optional population filter
 * @returns Array of reference ranges
 */
export function getAnalyteReferenceRanges(
  analyteId: string,
  familyId: string,
  population?: string
) {
  const family = catalog.families[familyId];
  if (!family) return [];

  const analyte = family.analytes[analyteId];
  if (!analyte) return [];

  if (population) {
    return analyte.referenceRanges.filter(range => range.population === population);
  }

  return analyte.referenceRanges;
}

/**
 * Get analyte information by ID and family
 * @param analyteId - The analyte identifier
 * @param familyId - The family identifier
 * @returns Analyte data or null if not found
 */
export function getAnalyte(analyteId: string, familyId: string): Analyte | null {
  const family = catalog.families[familyId];
  if (!family) return null;

  return family.analytes[analyteId] || null;
}

/**
 * Get all analyte families
 * @returns Record of all families
 */
export function getAllFamilies(): Record<string, AnalyteFamily> {
  return catalog.families;
}

/**
 * Search for analytes by name or symbol
 * @param query - Search query
 * @returns Array of matching analytes with their family information
 */
export function searchAnalytes(query: string): Array<{
  analyteId: string;
  familyId: string;
  analyte: Analyte;
  family: AnalyteFamily;
}> {
  const results: Array<{
    analyteId: string;
    familyId: string;
    analyte: Analyte;
    family: AnalyteFamily;
  }> = [];

  const searchTerm = query.toLowerCase();

  Object.entries(catalog.families).forEach(([familyId, family]) => {
    Object.entries(family.analytes).forEach(([analyteId, analyte]) => {
      if (
        analyte.name.toLowerCase().includes(searchTerm) ||
        analyte.symbol.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          analyteId,
          familyId,
          analyte,
          family
        });
      }
    });
  });

  return results;
}

/**
 * Format a value with appropriate precision for a specific unit
 * @param value - The numeric value
 * @param unit - The unit data
 * @returns Formatted string
 */
export function formatAnalyteValue(value: number, unit: AnalyteUnit): string {
  return `${value.toFixed(unit.precision)} ${unit.symbol}`;
}

/**
 * Check if a value is within reference range
 * @param value - The value to check
 * @param range - The reference range
 * @returns Object with status and interpretation
 */
export function checkReferenceRange(
  value: number,
  range: { min?: number; max?: number }
): {
  status: 'normal' | 'low' | 'high' | 'unknown';
  interpretation: string;
} {
  if (range.min !== undefined && value < range.min) {
    return {
      status: 'low',
      interpretation: `Abaixo do valor de referência (mín: ${range.min})`
    };
  }

  if (range.max !== undefined && value > range.max) {
    return {
      status: 'high',
      interpretation: `Acima do valor de referência (máx: ${range.max})`
    };
  }

  if (range.min !== undefined || range.max !== undefined) {
    return {
      status: 'normal',
      interpretation: 'Dentro do valor de referência'
    };
  }

  return {
    status: 'unknown',
    interpretation: 'Valor de referência não disponível'
  };
}

export { catalog as analyteCatalog };
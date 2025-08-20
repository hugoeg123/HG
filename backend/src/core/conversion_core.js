const fs = require('fs');
const path = require('path');

/**
 * ConversionEngine - Core class for unit and analyte conversions
 * 
 * Integrates with:
 * - units/units.factors.json for unit conversion factors
 * - units/units.synonyms.json for unit normalization
 * - analytes/analytes.catalog.json for analyte data
 * - analytes/analytes.synonyms.json for analyte normalization
 * - Used by backend/src/controllers/ConversionController.js
 * 
 * @class ConversionEngine
 */
class ConversionEngine {
  constructor() {
    this.unitFactors = null;
    this.unitSynonyms = null;
    this.analytesCatalog = null;
    this.analytesSynonyms = null;
    this.initialized = false;
  }

  /**
   * Initialize the conversion engine by loading all catalogs
   * 
   * Hook: Called during server startup or first conversion request
   * 
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Load unit conversion factors
      const unitsFactorsPath = path.join(__dirname, 'units', 'units.factors.json');
      this.unitFactors = JSON.parse(fs.readFileSync(unitsFactorsPath, 'utf8'));

      // Load unit synonyms
      const unitsSynonymsPath = path.join(__dirname, 'units', 'units.synonyms.json');
      this.unitSynonyms = JSON.parse(fs.readFileSync(unitsSynonymsPath, 'utf8'));

      // Load analytes catalog
      const analytesCatalogPath = path.join(__dirname, 'analytes', 'analytes.catalog.json');
      this.analytesCatalog = JSON.parse(fs.readFileSync(analytesCatalogPath, 'utf8'));

      // Load analytes synonyms
      const analytesSynonymsPath = path.join(__dirname, 'analytes', 'analytes.synonyms.json');
      this.analytesSynonyms = JSON.parse(fs.readFileSync(analytesSynonymsPath, 'utf8'));

      this.initialized = true;
      console.log('ConversionEngine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ConversionEngine:', error);
      throw new Error(`ConversionEngine initialization failed: ${error.message}`);
    }
  }

  /**
   * Ensure the engine is initialized before operations
   * 
   * @private
   */
  _ensureInitialized() {
    if (!this.initialized) {
      throw new Error('ConversionEngine not initialized. Call initialize() first.');
    }
  }

  /**
   * Normalize unit name using synonyms mapping
   * 
   * @param {string} unit - Unit to normalize
   * @returns {string} Normalized unit name
   */
  normalizeUnit(unit) {
    this._ensureInitialized();
    
    if (!unit || typeof unit !== 'string') {
      throw new Error('Unit must be a non-empty string');
    }

    const normalizedInput = unit.toLowerCase().trim();
    
    // Check if it's a synonym
    if (this.unitSynonyms.synonyms[normalizedInput]) {
      return this.unitSynonyms.synonyms[normalizedInput];
    }

    // Return as-is if no synonym found
    return normalizedInput;
  }

  /**
   * Normalize analyte name using synonyms mapping
   * 
   * @param {string} analyte - Analyte to normalize
   * @returns {string} Normalized analyte name
   */
  normalizeAnalyte(analyte) {
    this._ensureInitialized();
    
    if (!analyte || typeof analyte !== 'string') {
      throw new Error('Analyte must be a non-empty string');
    }

    const normalizedInput = analyte.toLowerCase().trim();
    
    // Check if it's a synonym
    if (this.analytesSynonyms.synonyms[normalizedInput]) {
      return this.analytesSynonyms.synonyms[normalizedInput];
    }

    // Return as-is if no synonym found
    return normalizedInput;
  }

  /**
   * Get unit conversion factor for a specific dimension
   * 
   * @param {string} unit - Unit name (normalized)
   * @param {string} dimension - Dimension (mass, volume, time, etc.)
   * @returns {number|null} Conversion factor or null if not found
   */
  getUnitFactor(unit, dimension) {
    this._ensureInitialized();
    
    const normalizedUnit = this.normalizeUnit(unit);
    const dimensionData = this.unitFactors.dimensions[dimension];
    
    if (!dimensionData) {
      return null;
    }

    return dimensionData.units[normalizedUnit] || null;
  }

  /**
   * Get analyte data from catalog
   * 
   * @param {string} analyte - Analyte name
   * @returns {Object|null} Analyte data or null if not found
   */
  getAnalyteData(analyte) {
    this._ensureInitialized();
    
    const normalizedAnalyte = this.normalizeAnalyte(analyte);
    return this.analytesCatalog.analytes[normalizedAnalyte] || null;
  }

  /**
   * Convert value between units of the same dimension
   * 
   * @param {number} value - Value to convert
   * @param {string} fromUnit - Source unit
   * @param {string} toUnit - Target unit
   * @param {string} dimension - Unit dimension
   * @returns {number} Converted value
   */
  convertValue(value, fromUnit, toUnit, dimension) {
    this._ensureInitialized();
    
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error('Value must be a valid number');
    }

    const fromFactor = this.getUnitFactor(fromUnit, dimension);
    const toFactor = this.getUnitFactor(toUnit, dimension);

    if (fromFactor === null) {
      throw new Error(`Unknown unit '${fromUnit}' for dimension '${dimension}'`);
    }

    if (toFactor === null) {
      throw new Error(`Unknown unit '${toUnit}' for dimension '${dimension}'`);
    }

    // Convert: value * (fromFactor / toFactor)
    return value * (fromFactor / toFactor);
  }

  /**
   * Convert analyte value between conventional and SI units
   * 
   * @param {number} value - Value to convert
   * @param {string} analyte - Analyte name
   * @param {string} direction - 'conventional_to_si' or 'si_to_conventional'
   * @returns {Object} Conversion result with value and units
   */
  convertAnalyteValue(value, analyte, direction) {
    this._ensureInitialized();
    
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error('Value must be a valid number');
    }

    const analyteData = this.getAnalyteData(analyte);
    if (!analyteData) {
      throw new Error(`Unknown analyte: ${analyte}`);
    }

    const conversion = analyteData.canonical_conversion;
    if (!conversion) {
      throw new Error(`No conversion data available for analyte: ${analyte}`);
    }

    let convertedValue;
    let fromUnit, toUnit;

    if (direction === 'conventional_to_si') {
      convertedValue = value * conversion.factor;
      fromUnit = conversion.conventional_unit;
      toUnit = conversion.si_unit;
    } else if (direction === 'si_to_conventional') {
      convertedValue = value / conversion.factor;
      fromUnit = conversion.si_unit;
      toUnit = conversion.conventional_unit;
    } else {
      throw new Error('Direction must be "conventional_to_si" or "si_to_conventional"');
    }

    return {
      value: convertedValue,
      fromUnit,
      toUnit,
      analyte: analyteData.name
    };
  }

  /**
   * Convert between mEq/L and mmol/L for electrolytes
   * 
   * @param {number} value - Value to convert
   * @param {string} analyte - Analyte name
   * @param {string} direction - 'meq_to_mmol' or 'mmol_to_meq'
   * @returns {Object} Conversion result
   */
  convertElectrolyte(value, analyte, direction) {
    this._ensureInitialized();
    
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error('Value must be a valid number');
    }

    const analyteData = this.getAnalyteData(analyte);
    if (!analyteData) {
      throw new Error(`Unknown analyte: ${analyte}`);
    }

    const meqConversion = analyteData.meq_conversion;
    if (!meqConversion) {
      throw new Error(`No mEq conversion data available for analyte: ${analyte}`);
    }

    let convertedValue;
    let fromUnit, toUnit;

    if (direction === 'meq_to_mmol') {
      convertedValue = value / meqConversion.valence;
      fromUnit = 'mEq/L';
      toUnit = 'mmol/L';
    } else if (direction === 'mmol_to_meq') {
      convertedValue = value * meqConversion.valence;
      fromUnit = 'mmol/L';
      toUnit = 'mEq/L';
    } else {
      throw new Error('Direction must be "meq_to_mmol" or "mmol_to_meq"');
    }

    return {
      value: convertedValue,
      fromUnit,
      toUnit,
      analyte: analyteData.name,
      valence: meqConversion.valence
    };
  }

  /**
   * Get all available units for a specific dimension
   * 
   * @param {string} dimension - Dimension name
   * @returns {Array<string>} Array of unit names
   */
  getUnitsForDimension(dimension) {
    this._ensureInitialized();
    
    const dimensionData = this.unitFactors.dimensions[dimension];
    if (!dimensionData) {
      return [];
    }

    return Object.keys(dimensionData.units);
  }

  /**
   * Get all available dimensions
   * 
   * @returns {Array<string>} Array of dimension names
   */
  getDimensions() {
    this._ensureInitialized();
    return Object.keys(this.unitFactors.dimensions);
  }

  /**
   * Get all available analytes
   * 
   * @returns {Array<Object>} Array of analyte objects with basic info
   */
  getAnalytes() {
    this._ensureInitialized();
    
    return Object.entries(this.analytesCatalog.analytes).map(([key, data]) => ({
      id: key,
      name: data.name,
      category: data.category,
      hasConversion: !!data.canonical_conversion,
      hasMeqConversion: !!data.meq_conversion
    }));
  }

  /**
   * Validate if a conversion is possible between two units
   * 
   * @param {string} fromUnit - Source unit
   * @param {string} toUnit - Target unit
   * @returns {Object} Validation result with dimension info
   */
  validateConversion(fromUnit, toUnit) {
    this._ensureInitialized();
    
    const normalizedFrom = this.normalizeUnit(fromUnit);
    const normalizedTo = this.normalizeUnit(toUnit);
    
    // Find dimensions for both units
    const dimensions = this.getDimensions();
    let fromDimension = null;
    let toDimension = null;
    
    for (const dimension of dimensions) {
      const units = this.getUnitsForDimension(dimension);
      if (units.includes(normalizedFrom)) {
        fromDimension = dimension;
      }
      if (units.includes(normalizedTo)) {
        toDimension = dimension;
      }
    }

    return {
      isValid: fromDimension === toDimension && fromDimension !== null,
      fromDimension,
      toDimension,
      normalizedFromUnit: normalizedFrom,
      normalizedToUnit: normalizedTo
    };
  }
}

// Create singleton instance
const conversionEngine = new ConversionEngine();

/**
 * Get the singleton ConversionEngine instance
 * 
 * Hook: Used by controllers and services throughout the application
 * 
 * @returns {ConversionEngine} Singleton instance
 */
function getConversionEngine() {
  return conversionEngine;
}

/**
 * Initialize the conversion engine (convenience function)
 * 
 * @returns {Promise<void>}
 */
async function initializeConversionEngine() {
  await conversionEngine.initialize();
}

module.exports = {
  ConversionEngine,
  getConversionEngine,
  initializeConversionEngine
};
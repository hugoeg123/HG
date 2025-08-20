const { getConversionEngine } = require('../core/conversion_core.js');

/**
 * ConversionController - Handles unit and analyte conversion API endpoints
 * 
 * Integrates with:
 * - core/conversion_core.js for conversion logic
 * - Used by API routes in routes/conversion.js
 * - Frontend services/api.js calls these endpoints
 * 
 * @class ConversionController
 */
class ConversionController {
  constructor() {
    this.conversionEngine = getConversionEngine();
  }

  /**
   * Convert units endpoint
   * POST /api/conversions/convert-units
   * 
   * Hook: Called from frontend conversion forms
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async convertUnits(req, res) {
    try {
      const { value, fromUnit, toUnit, dimension, analyte, conversionType } = req.body;

      // Validate required fields
      if (typeof value !== 'number' || isNaN(value)) {
        return res.status(400).json({
          error: 'Value must be a valid number',
          code: 'INVALID_VALUE'
        });
      }

      if (!fromUnit || !toUnit) {
        return res.status(400).json({
          error: 'Both fromUnit and toUnit are required',
          code: 'MISSING_UNITS'
        });
      }

      let result;

      // Handle different conversion types
      switch (conversionType) {
        case 'dimensional':
          if (!dimension) {
            return res.status(400).json({
              error: 'Dimension is required for dimensional conversions',
              code: 'MISSING_DIMENSION'
            });
          }
          
          result = {
            value: this.conversionEngine.convertValue(value, fromUnit, toUnit, dimension),
            fromUnit: this.conversionEngine.normalizeUnit(fromUnit),
            toUnit: this.conversionEngine.normalizeUnit(toUnit),
            dimension,
            conversionType: 'dimensional'
          };
          break;

        case 'analyte':
          if (!analyte) {
            return res.status(400).json({
              error: 'Analyte is required for analyte conversions',
              code: 'MISSING_ANALYTE'
            });
          }

          // Determine direction based on units
          let direction;
          const analyteData = this.conversionEngine.getAnalyteData(analyte);
          if (!analyteData || !analyteData.canonical_conversion) {
            return res.status(400).json({
              error: `No conversion data available for analyte: ${analyte}`,
              code: 'ANALYTE_NO_CONVERSION'
            });
          }

          const conventionalUnit = analyteData.canonical_conversion.conventional_unit.toLowerCase();
          const siUnit = analyteData.canonical_conversion.si_unit.toLowerCase();
          const normalizedFrom = this.conversionEngine.normalizeUnit(fromUnit).toLowerCase();
          const normalizedTo = this.conversionEngine.normalizeUnit(toUnit).toLowerCase();

          if (normalizedFrom === conventionalUnit && normalizedTo === siUnit) {
            direction = 'conventional_to_si';
          } else if (normalizedFrom === siUnit && normalizedTo === conventionalUnit) {
            direction = 'si_to_conventional';
          } else {
            return res.status(400).json({
              error: `Invalid unit combination for analyte ${analyte}`,
              code: 'INVALID_ANALYTE_UNITS'
            });
          }

          result = this.conversionEngine.convertAnalyteValue(value, analyte, direction);
          result.conversionType = 'analyte';
          break;

        case 'electrolyte':
          if (!analyte) {
            return res.status(400).json({
              error: 'Analyte is required for electrolyte conversions',
              code: 'MISSING_ANALYTE'
            });
          }

          // Determine direction for mEq/mmol conversion
          const fromLower = fromUnit.toLowerCase();
          const toLower = toUnit.toLowerCase();
          let electrolyteDirection;

          if ((fromLower.includes('meq') || fromLower.includes('meq')) && 
              (toLower.includes('mmol') || toLower.includes('mol'))) {
            electrolyteDirection = 'meq_to_mmol';
          } else if ((fromLower.includes('mmol') || fromLower.includes('mol')) && 
                     (toLower.includes('meq') || toLower.includes('meq'))) {
            electrolyteDirection = 'mmol_to_meq';
          } else {
            return res.status(400).json({
              error: 'Invalid units for electrolyte conversion',
              code: 'INVALID_ELECTROLYTE_UNITS'
            });
          }

          result = this.conversionEngine.convertElectrolyte(value, analyte, electrolyteDirection);
          result.conversionType = 'electrolyte';
          break;

        default:
          // Auto-detect conversion type
          const validation = this.conversionEngine.validateConversion(fromUnit, toUnit);
          if (validation.isValid) {
            result = {
              value: this.conversionEngine.convertValue(value, fromUnit, toUnit, validation.fromDimension),
              fromUnit: validation.normalizedFromUnit,
              toUnit: validation.normalizedToUnit,
              dimension: validation.fromDimension,
              conversionType: 'dimensional'
            };
          } else {
            return res.status(400).json({
              error: 'Cannot convert between incompatible units',
              code: 'INCOMPATIBLE_UNITS',
              details: validation
            });
          }
      }

      res.json({
        success: true,
        result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Conversion error:', error);
      res.status(500).json({
        error: error.message,
        code: 'CONVERSION_ERROR'
      });
    }
  }

  /**
   * Get available units endpoint
   * GET /api/conversions/units
   * 
   * Hook: Called from frontend to populate unit dropdowns
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUnits(req, res) {
    try {
      const { dimension } = req.query;

      if (dimension) {
        // Get units for specific dimension
        const units = this.conversionEngine.getUnitsForDimension(dimension);
        res.json({
          success: true,
          dimension,
          units
        });
      } else {
        // Get all dimensions and their units
        const dimensions = this.conversionEngine.getDimensions();
        const allUnits = {};
        
        dimensions.forEach(dim => {
          allUnits[dim] = this.conversionEngine.getUnitsForDimension(dim);
        });

        res.json({
          success: true,
          dimensions: allUnits
        });
      }
    } catch (error) {
      console.error('Get units error:', error);
      res.status(500).json({
        error: error.message,
        code: 'GET_UNITS_ERROR'
      });
    }
  }

  /**
   * Get available analytes endpoint
   * GET /api/conversions/analytes
   * 
   * Hook: Called from frontend to populate analyte dropdowns
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAnalytes(req, res) {
    try {
      const { category, hasConversion } = req.query;
      
      let analytes = this.conversionEngine.getAnalytes();

      // Filter by category if specified
      if (category) {
        analytes = analytes.filter(analyte => 
          analyte.category.toLowerCase() === category.toLowerCase()
        );
      }

      // Filter by conversion availability if specified
      if (hasConversion !== undefined) {
        const hasConv = hasConversion === 'true';
        analytes = analytes.filter(analyte => analyte.hasConversion === hasConv);
      }

      res.json({
        success: true,
        analytes,
        total: analytes.length
      });
    } catch (error) {
      console.error('Get analytes error:', error);
      res.status(500).json({
        error: error.message,
        code: 'GET_ANALYTES_ERROR'
      });
    }
  }

  /**
   * Get analyte details endpoint
   * GET /api/conversions/analytes/:analyte
   * 
   * Hook: Called from frontend to get detailed analyte information
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAnalyteDetails(req, res) {
    try {
      const { analyte } = req.params;
      
      if (!analyte) {
        return res.status(400).json({
          error: 'Analyte parameter is required',
          code: 'MISSING_ANALYTE'
        });
      }

      const analyteData = this.conversionEngine.getAnalyteData(analyte);
      
      if (!analyteData) {
        return res.status(404).json({
          error: `Analyte not found: ${analyte}`,
          code: 'ANALYTE_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        analyte: analyteData
      });
    } catch (error) {
      console.error('Get analyte details error:', error);
      res.status(500).json({
        error: error.message,
        code: 'GET_ANALYTE_DETAILS_ERROR'
      });
    }
  }

  /**
   * Validate conversion endpoint
   * POST /api/conversions/validate
   * 
   * Hook: Called from frontend to validate conversion before execution
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async validateConversion(req, res) {
    try {
      const { fromUnit, toUnit } = req.body;

      if (!fromUnit || !toUnit) {
        return res.status(400).json({
          error: 'Both fromUnit and toUnit are required',
          code: 'MISSING_UNITS'
        });
      }

      const validation = this.conversionEngine.validateConversion(fromUnit, toUnit);
      
      res.json({
        success: true,
        validation
      });
    } catch (error) {
      console.error('Validate conversion error:', error);
      res.status(500).json({
        error: error.message,
        code: 'VALIDATE_CONVERSION_ERROR'
      });
    }
  }
}

// Create singleton instance
const conversionController = new ConversionController();

/**
 * Get the singleton ConversionController instance
 * 
 * Hook: Used by route handlers
 * 
 * @returns {ConversionController} Singleton instance
 */
function getConversionController() {
  return conversionController;
}

module.exports = {
  ConversionController,
  getConversionController
};
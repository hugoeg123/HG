/**
 * Regras de validação para Sinais Vitais
 * Define limites de normalidade (para simplificação, valores gerais de adulto)
 * 
 * TODO: Expandir para considerar idade e sexo
 */

export const VITAL_LIMITS = {
    pas: {
        max: 180,
        min: 90,
        label: 'PAS',
        color: 'text-red-500 font-bold',
        msg: 'PA Sistólica alterada'
    },
    pad: {
        max: 80,
        min: 60,
        label: 'PAD',
        color: 'text-red-500 font-bold',
        msg: 'PA Diastólica alterada'
    },
    fc: {
        max: 100,
        min: 60,
        label: 'FC',
        color: 'text-red-500 font-bold',
        msg: 'Taquicardia/Bradicardia'
    },
    fr: {
        max: 20,
        min: 12,
        label: 'FR',
        color: 'text-red-500 font-bold',
        msg: 'Taquipneia/Bradipneia'
    },
    spo2: {
        min: 92,
        label: 'SpO2',
        color: 'text-red-500 font-bold',
        msg: 'Dessaturação'
    },
    temp: {
        max: 37.8,
        min: 35,
        label: 'Temp',
        color: 'text-red-500 font-bold',
        msg: 'Febre/Hipotermia'
    }
};

/**
 * Checa se um valor está fora dos limites
 * @param {string} type - Tipo (pas, pad, fc, fr, spo2, temp)
 * @param {number} value - Valor numérico
 * @returns {object|null} - Retorna objeto com erro se fora do limite, ou null se normal
 */
export const checkVitalLimit = (type, value) => {
    const rule = VITAL_LIMITS[type.toLowerCase()];
    if (!rule) return null;

    let isAbnormal = false;
    if (rule.max !== undefined && value > rule.max) isAbnormal = true;
    if (rule.min !== undefined && value < rule.min) isAbnormal = true;

    if (isAbnormal) {
        return {
            isAbnormal: true,
            msg: rule.msg,
            className: rule.color
        };
    }
    return null;
};

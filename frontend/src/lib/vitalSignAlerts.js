/**
 * Vital Sign Alert Logic
 * Based on standard medical thresholds for adults (18+).
 * 
 * Future extensibility:
 * - Add pediatric thresholds (checking age).
 * - Add pregnancy specific thresholds.
 */

// Threshold definitions
export const THRESHOLDS = {
    // Blood Pressure (mmHg) - JNC 7 / AHA definitions simplified for alert triggers
    BP: {
        HYPERTENSIVE_EMERGENCY: { sys: 180, dia: 120 },
        HYPERTENSIVE_URGENCY: { sys: 140, dia: 90 }, // Using >= 140/90 as general hypertensive alert
        HYPOTENSION: { sys: 90, dia: 60 },
        SEVERE_HYPOTENSION: { sys: 80, dia: 50 },
    },
    // Heart Rate (bpm)
    HR: {
        TACHYCARDIA: 100,
        BRADYCARDIA: 60,
        SEVERE_TACHYCARDIA: 150, // Immediate attention
        SEVERE_BRADYCARDIA: 50,
    },
    // Respiratory Rate (bpm)
    RR: {
        TACHYPNEA: 20,
        BRADYPNEA: 12,
    },
    // Oxygen Saturation (%)
    SPO2: {
        HYPOXEMIA: 94,
        SEVERE_HYPOXEMIA: 90,
    },
    // Temperature (Celsius)
    TEMP: {
        FEVER: 37.8,
        HYPOTHERMIA: 35.0,
    }
};

/**
 * Calculates severity alerts for a given set of vital signs.
 * 
 * @param {Object} vitals - The vital signs object.
 * @param {number} vitals.systolic - Systolic Blood Pressure.
 * @param {number} vitals.diastolic - Diastolic Blood Pressure.
 * @param {number} vitals.heartRate - Heart Rate.
 * @param {number} vitals.respiratoryRate - Respiratory Rate.
 * @param {number} vitals.spo2 - Oxygen Saturation.
 * @param {number} vitals.temp - Temperature.
 * @param {Object} context - Patient context (age, sex, etc.).
 * @returns {Array} - Array of alert objects { type: 'emergency'|'warning', message: string, key: string }.
 */
export const calculateSeverity = (vitals, context = {}) => {
    const alerts = [];
    const { systolic, diastolic, heartRate, respiratoryRate, spo2, temp } = vitals;
    const { age = 25, isPregnant = false, hasCOPD = false, onRoomAir = true } = context;

    if (age < 18) {
        // Pediatric logic placeholder
        return [];
    }

    // --- Blood Pressure Checks ---
    if (systolic || diastolic) {
        const sys = Number(systolic);
        const dia = Number(diastolic);

        // Hypertensive Emergency
        if (sys >= THRESHOLDS.BP.HYPERTENSIVE_EMERGENCY.sys || dia >= THRESHOLDS.BP.HYPERTENSIVE_EMERGENCY.dia) {
            alerts.push({
                type: 'emergency',
                key: 'bp_emergency',
                message: 'CRISE HIPERTENSIVA (EMERGÊNCIA): PA ≥ 180/120. Risco de lesão de órgão alvo.',
                value: `${sys}/${dia}`
            });
        }
        // Hypertensive Urgency / Stage 2
        else if (sys >= THRESHOLDS.BP.HYPERTENSIVE_URGENCY.sys || dia >= THRESHOLDS.BP.HYPERTENSIVE_URGENCY.dia) {
            alerts.push({
                type: 'warning',
                key: 'bp_high',
                message: 'Hipertensão (PA ≥ 140/90). Monitorar.',
                value: `${sys}/${dia}`
            });
        }
        // Severe Hypotension
        else if (sys <= THRESHOLDS.BP.SEVERE_HYPOTENSION.sys && sys > 0) {
            alerts.push({
                type: 'emergency',
                key: 'bp_severe_low',
                message: 'DECHOQUE/HIPOTENSÃO GRAVE: PAS ≤ 80. Avaliar perfusão.',
                value: `${sys}/${dia}`
            });
        }
        // Hypotension
        else if (sys <= THRESHOLDS.BP.HYPOTENSION.sys && sys > 0) {
            alerts.push({
                type: 'warning',
                key: 'bp_low',
                message: 'Hipotensão (PAS ≤ 90). Avaliar sintomas.',
                value: `${sys}/${dia}`
            });
        }
    }

    if (heartRate && age >= 18) {
        const hr = Number(heartRate);
        if (isPregnant) {
            if (hr >= 110) {
                alerts.push({ type: 'warning', key: 'hr_high_pregnancy', message: 'FC ≥ 110 bpm (gestante).', value: `${hr} bpm` });
            } else if (hr < 50 && hr > 0) {
                alerts.push({ type: 'warning', key: 'hr_low_pregnancy', message: 'FC < 50 bpm (gestante).', value: `${hr} bpm` });
            }
        } else {
            if (hr > THRESHOLDS.HR.TACHYCARDIA) {
                alerts.push({ type: 'warning', key: 'hr_high', message: 'FC > 100 bpm (adulto, não gestante).', value: `${hr} bpm` });
            } else if (hr < THRESHOLDS.HR.BRADYCARDIA && hr > 0) {
                alerts.push({ type: 'warning', key: 'hr_low', message: 'FC < 60 bpm (adulto, não gestante).', value: `${hr} bpm` });
            }
        }
    }

    if (spo2) {
        const sat = Number(spo2);
        if (hasCOPD && onRoomAir) {
            if (sat < 88 && sat > 0) alerts.push({ type: 'emergency', key: 'spo2_copd_very_low', message: 'SpO2 < 88% (DPOC).', value: `${sat}%` });
            else if (sat > 96) alerts.push({ type: 'warning', key: 'spo2_copd_high', message: 'SpO2 > 96% (risco de hipercapnia em DPOC).', value: `${sat}%` });
        } else if (onRoomAir) {
            if (sat <= 92 && sat > 0) alerts.push({ type: 'warning', key: 'spo2_low', message: 'SpO2 ≤ 92% em ar ambiente.', value: `${sat}%` });
        }
    }

    if (respiratoryRate) {
        const rr = Number(respiratoryRate);
        if ((rr < THRESHOLDS.RR.BRADYPNEA && rr > 0) || rr > THRESHOLDS.RR.TACHYPNEA) {
            alerts.push({ type: 'warning', key: 'rr_outside', message: 'FR fora de 12–20 irpm.', value: `${rr} irpm` });
        }
    }

    if (typeof temp === 'number' && !Number.isNaN(Number(temp))) {
        const t = Number(temp);
        if (t > THRESHOLDS.TEMP.FEVER) {
            alerts.push({ type: 'warning', key: 'temp_high', message: 'Temperatura > 37,8 °C.', value: `${t} °C` });
        } else if (t < THRESHOLDS.TEMP.HYPOTHERMIA && t > 0) {
            alerts.push({ type: 'warning', key: 'temp_low', message: 'Temperatura < 35,0 °C.', value: `${t} °C` });
        }
    }

    return alerts;
};

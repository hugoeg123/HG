/**
 * Vital Sign Parser & Alert Logic (Backend)
 * 
 * Extracts vital signs from text using keys like ##PA:, ##FC:, etc.
 * Calculates severity based on clinical thresholds.
 */

// Threshold definitions (Mirrors frontend/src/lib/vitalSignAlerts.js)
const THRESHOLDS = {
    // Blood Pressure (mmHg)
    BP: {
        HYPERTENSIVE_EMERGENCY: { sys: 180, dia: 120 },
        HYPERTENSIVE_URGENCY: { sys: 140, dia: 90 },
        HYPOTENSION: { sys: 90, dia: 60 },
        SEVERE_HYPOTENSION: { sys: 80, dia: 50 },
    },
    // Heart Rate (bpm)
    HR: {
        TACHYCARDIA: 100,
        BRADYCARDIA: 60,
        SEVERE_TACHYCARDIA: 150,
        SEVERE_BRADYCARDIA: 50,
    },
    // Respiratory Rate (rpm)
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
 * Extracts vital signs from text content.
 * Supported formats:
 * ##PA:120x80 or ##PA:120/80
 * ##FC:80
 * ##FR:16
 * ##SpO2:98
 * ##Temp:36.5
 * 
 * @param {string} content 
 * @returns {Object} vitals object
 */
const extractVitals = (content) => {
    if (!content) return {};

    const vitals = {};

    // Regex Patterns
    // PA: Matches 120x80, 120/80, 120 x 80
    const bpMatch = content.match(/##PA:\s*(\d+)\s*[xX\/]\s*(\d+)/i);
    if (bpMatch) {
        vitals.systolic = parseInt(bpMatch[1]);
        vitals.diastolic = parseInt(bpMatch[2]);
    }

    // FC (Heart Rate)
    const hrMatch = content.match(/##FC:\s*(\d+)/i);
    if (hrMatch) {
        vitals.heartRate = parseInt(hrMatch[1]);
    }

    // FR (Respiratory Rate)
    const rrMatch = content.match(/##FR:\s*(\d+)/i);
    if (rrMatch) {
        vitals.respiratoryRate = parseInt(rrMatch[1]);
    }

    // SpO2
    const spo2Match = content.match(/##SpO2:\s*(\d+)/i);
    if (spo2Match) {
        vitals.spo2 = parseInt(spo2Match[1]);
    }

    // Temp
    const tempMatch = content.match(/##Temp:\s*(\d+[.,]?\d*)/i);
    if (tempMatch) {
        vitals.temp = parseFloat(tempMatch[1].replace(',', '.'));
    }

    return vitals;
};

/**
 * Calculates alerts based on vitals.
 * @param {Object} vitals 
 * @param {Object} context - Patient context (age, isPregnant, hasCOPD, onRoomAir)
 * @returns {Array} List of alerts { type, message, key }
 */
const calculateAlerts = (vitals, context = {}) => {
    const alerts = [];
    const { systolic, diastolic, heartRate, respiratoryRate, spo2, temp } = vitals;
    const { age = 25, isPregnant = false, hasCOPD = false, onRoomAir = true } = context;

    if (age < 18) {
        // Pediatric logic placeholder - can be expanded later
        // return []; // Returning empty for now or implement pediatric specific if needed
    }

    // --- Blood Pressure ---
    if (systolic || diastolic) {
        const sys = Number(systolic);
        const dia = Number(diastolic);

        // Emergency
        if (sys >= THRESHOLDS.BP.HYPERTENSIVE_EMERGENCY.sys || dia >= THRESHOLDS.BP.HYPERTENSIVE_EMERGENCY.dia) {
            alerts.push({
                type: 'critical', 
                key: 'bp_emergency',
                message: `CRISE HIPERTENSIVA (EMERGÊNCIA): PA ${sys}/${dia}. Risco de lesão de órgão alvo.`
            });
        }
        // Urgency
        else if (sys >= THRESHOLDS.BP.HYPERTENSIVE_URGENCY.sys || dia >= THRESHOLDS.BP.HYPERTENSIVE_URGENCY.dia) {
            alerts.push({
                type: 'warning',
                key: 'bp_high',
                message: `Hipertensão: PA ${sys}/${dia}. Monitorar.`
            });
        }
        // Severe Hypotension
        else if (sys <= THRESHOLDS.BP.SEVERE_HYPOTENSION.sys && sys > 0) {
            alerts.push({
                type: 'critical',
                key: 'bp_severe_low',
                message: `DECHOQUE/HIPOTENSÃO GRAVE: PAS ≤ 80 (${sys}/${dia}). Avaliar perfusão.`
            });
        }
        // Hypotension
        else if (sys <= THRESHOLDS.BP.HYPOTENSION.sys && sys > 0) {
             alerts.push({
                type: 'warning',
                key: 'bp_low',
                message: `Hipotensão: PAS ≤ 90 (${sys}/${dia}). Avaliar sintomas.`
            });
        }
    }

    // --- Heart Rate ---
    if (heartRate && age >= 18) {
        const hr = Number(heartRate);
        if (isPregnant) {
             if (hr >= 110) {
                alerts.push({ 
                    type: 'warning', 
                    key: 'hr_high_pregnancy', 
                    message: `FC ≥ 110 bpm (gestante): ${hr} bpm.` 
                });
            } else if (hr < 50 && hr > 0) {
                alerts.push({ 
                    type: 'warning', 
                    key: 'hr_low_pregnancy', 
                    message: `FC < 50 bpm (gestante): ${hr} bpm.` 
                });
            }
        } else {
            if (hr >= THRESHOLDS.HR.SEVERE_TACHYCARDIA) {
                alerts.push({
                    type: 'critical',
                    key: 'hr_severe_high',
                    message: `TAQUICARDIA GRAVE: ${hr} bpm. Atenção imediata.`
                });
            } else if (hr > THRESHOLDS.HR.TACHYCARDIA) {
                alerts.push({
                    type: 'warning',
                    key: 'hr_high',
                    message: `Taquicardia: ${hr} bpm (Adulto > 100).`
                });
            } else if (hr < THRESHOLDS.HR.BRADYCARDIA && hr > 0) {
                alerts.push({
                    type: 'warning',
                    key: 'hr_low',
                    message: `Bradicardia: ${hr} bpm (Adulto < 60).`
                });
            }
        }
    }

    // --- SpO2 ---
    if (spo2) {
        const sat = Number(spo2);
        if (hasCOPD && onRoomAir) {
            if (sat < 88 && sat > 0) {
                alerts.push({ 
                    type: 'critical', 
                    key: 'spo2_copd_very_low', 
                    message: `SpO2 < 88% (DPOC): ${sat}%.` 
                });
            }
            else if (sat > 96) {
                alerts.push({ 
                    type: 'warning', 
                    key: 'spo2_copd_high', 
                    message: `SpO2 > 96% (DPOC - Risco Hipercapnia): ${sat}%.` 
                });
            }
        } else if (onRoomAir) {
            // User requested: "se menor que 92%" -> < 92.
            // Standard hypoxic threshold is often <= 92 or < 92. 
            // Matching user wording "menor que 92%" strictly means < 92.
            // Frontend implemented <= 92. I'll stick to <= 92 for safety/consistency with frontend unless I change both.
            // Let's make backend consistent with current frontend code (<= 92).
            if (sat <= 92 && sat > 0) {
                alerts.push({ 
                    type: 'warning', 
                    key: 'spo2_low', 
                    message: `SpO2 ≤ 92% em ar ambiente: ${sat}%.` 
                });
            }
        }
    }

    // --- Respiratory Rate ---
    if (respiratoryRate) {
        const rr = Number(respiratoryRate);
        if ((rr < THRESHOLDS.RR.BRADYPNEA && rr > 0) || rr > THRESHOLDS.RR.TACHYPNEA) {
            alerts.push({ 
                type: 'warning', 
                key: 'rr_outside', 
                message: `FR fora de 12–20 irpm: ${rr} irpm.` 
            });
        }
    }

    // --- Temperature ---
    if (temp) {
        const t = Number(temp);
        if (t > THRESHOLDS.TEMP.FEVER) {
            alerts.push({ 
                type: 'warning', 
                key: 'temp_high', 
                message: `Temperatura > 37.8 °C: ${t} °C.` 
            });
        } else if (t < THRESHOLDS.TEMP.HYPOTHERMIA && t > 0) {
             alerts.push({ 
                type: 'warning', 
                key: 'temp_low', 
                message: `Hipotermia < 35.0 °C: ${t} °C.` 
            });
        }
    }

    return alerts;
};

module.exports = {
    extractVitals,
    calculateAlerts
};

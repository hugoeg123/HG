/**
 * Normaliza os dados do paciente para garantir consistência no frontend.
 * Principalmente lida com a diferença entre birthDate (frontend) e dateOfBirth (backend).
 */
export const normalizePatient = (patient) => {
    if (!patient) return null;
    return {
        ...patient,
        id: patient.id || null,
        name: patient.name || 'Sem Nome',
        // Padronização: backend usa dateOfBirth, frontend pode usar birthDate
        // Garantimos que ambos existam e sejam iguais
        birthDate: patient.dateOfBirth || patient.birthDate || null,
        dateOfBirth: patient.dateOfBirth || patient.birthDate || null,
        gender: patient.gender || null,
        phone: patient.phone || null,
        email: patient.email || null,
        address: patient.address || null,
        recordNumber: patient.recordNumber || null,
        insurancePlan: patient.insurancePlan || null,
        observations: patient.observations || null,
        records: Array.isArray(patient.records) ? patient.records : [],
        recordCount: patient.recordCount || 0,
    };
};

/**
 * Comparador seguro de IDs (string vs number)
 */
export const eqId = (a, b) => String(a) === String(b);

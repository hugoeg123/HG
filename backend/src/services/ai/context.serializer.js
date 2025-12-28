class ContextSerializer {
    serialize(type, data) {
        if (!data) return '';
        
        // If data is string, try to parse it (in case it came from JSON.stringify)
        let parsedData = data;
        if (typeof data === 'string') {
            try {
                parsedData = JSON.parse(data);
            } catch (e) {
                // Keep as string if not JSON
            }
        }

        switch (type) {
            case 'patient':
                return this.serializePatient(parsedData);
            case 'record':
                return this.serializeRecord(parsedData);
            default:
                return this.serializeGeneric(type, parsedData);
        }
    }

    serializePatient(patient) {
        const name = patient.name || 'Unknown';
        const age = patient.idade || patient.age || 'Unknown';
        const gender = patient.sexo || patient.gender || 'Unknown';
        
        let details = [];
        if (patient.allergies && patient.allergies.length) details.push(`ALERGIAS: ${Array.isArray(patient.allergies) ? patient.allergies.join(', ') : patient.allergies}`);
        if (patient.conditions && patient.conditions.length) details.push(`CONDIÇÕES: ${Array.isArray(patient.conditions) ? patient.conditions.join(', ') : patient.conditions}`);
        
        return `PACIENTE: ${name} | IDADE: ${age} | SEXO: ${gender} | ${details.join(' | ')}`;
    }

    serializeRecord(record) {
        const date = record.date || record.createdAt || 'Unknown Date';
        const type = record.type || 'General';
        const content = record.content || record.description || '';

        return `REGISTRO (${date}) - TIPO: ${type}\nCONTEÚDO: ${content}`;
    }

    serializeGeneric(type, data) {
        if (typeof data === 'string') return `${type.toUpperCase()}: ${data}`;
        return `${type.toUpperCase()}: ${JSON.stringify(data)}`;
    }
}

module.exports = new ContextSerializer();

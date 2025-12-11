export const DEFAULT_TAGS = [
    // --- ANAMNESE ---
    { id: '1', code: '#QP', name: 'Queixa Principal', category: 'Anamnese' },
    { id: '2', code: '#HDA', name: 'História da Doença Atual', category: 'Anamnese' },
    { id: '2_1', code: '##INICIO', name: 'Início dos Sintomas', category: 'Anamnese', parentId: '2' },
    { id: '2_2', code: '##CARACTERISTICA', name: 'Característica da Dor', category: 'Anamnese', parentId: '2' },
    { id: '2_3', code: '##FATORES', name: 'Fatores de Melhora/Piora', category: 'Anamnese', parentId: '2' },
    { id: '3', code: '#IS', name: 'Interrogatório Sintomatológico', category: 'Anamnese' },
    { id: '3_1', code: '##GERAL', name: 'Sintomas Gerais', category: 'Anamnese', parentId: '3' },
    { id: '4', code: '#HMP', name: 'Hist. Médica Pregressa', category: 'Anamnese' },
    { id: '4_1', code: '##COMORBIDADES', name: 'Comorbidades', category: 'Anamnese', parentId: '4' },
    { id: '4_2', code: '##CIRURGIAS', name: 'Cirurgias Prévias', category: 'Anamnese', parentId: '4' },
    { id: '5', code: '#MED', name: 'Medicamentos em Uso', category: 'Anamnese' },
    { id: '6', code: '#ALERGIAS', name: 'Alergias', category: 'Anamnese' },
    { id: '7', code: '#HMF', name: 'História Familiar', category: 'Anamnese' },
    { id: '8', code: '#HPS', name: 'História Psicossocial', category: 'Anamnese' },

    // --- EXAME FÍSICO ---
    { id: '9', code: '#SV', name: 'Sinais Vitais', category: 'Exame Físico' },
    { id: '9_1', code: '##PA', name: 'Pressão Arterial', category: 'Exame Físico', parentId: '9' },
    { id: '9_2', code: '##FC', name: 'Frequência Cardíaca', category: 'Exame Físico', parentId: '9' },
    { id: '9_3', code: '##FR', name: 'Frequência Respiratória', category: 'Exame Físico', parentId: '9' },
    { id: '9_4', code: '##Temp', name: 'Temperatura', category: 'Exame Físico', parentId: '9' },
    { id: '9_5', code: '##SpO2', name: 'Saturação de O2', category: 'Exame Físico', parentId: '9' },
    { id: '10', code: '#EF_GERAL', name: 'Estado Geral', category: 'Exame Físico' },
    { id: '11', code: '#EF_RESP', name: 'Ap. Respiratório', category: 'Exame Físico' },
    { id: '12', code: '#EF_CV', name: 'Ap. Cardiovascular', category: 'Exame Físico' },
    { id: '13', code: '#EF_ABD', name: 'Abdome', category: 'Exame Físico' },
    { id: '14', code: '#EF_NEURO', name: 'Neurológico', category: 'Exame Físico' },

    // --- INVESTIGAÇÃO ---
    { id: '15', code: '#EX_LAB', name: 'Exames Laboratoriais', category: 'Investigação' },
    { id: '16', code: '#EX_IMG', name: 'Exames de Imagem', category: 'Investigação' },

    // --- DIAGNÓSTICO ---
    { id: '17', code: '#HD', name: 'Hipótese Diagnóstica', category: 'Diagnóstico' },
    { id: '18', code: '#CID', name: 'CID-10', category: 'Diagnóstico' },

    // --- PLANO ---
    { id: '19', code: '#CONDUTA', name: 'Conduta', category: 'Plano' },
    { id: '20', code: '#RECEITA', name: 'Prescrição', category: 'Plano' },
    { id: '21', code: '#ORIENTACOES', name: 'Orientações', category: 'Plano' }
];

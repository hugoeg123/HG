import {
    Brain, Heart, Wind, Activity, Thermometer, Droplet, AlertTriangle,
    Stethoscope, Eye, Bone, BookText, FlaskConical, ClipboardList, Pill,
    Monitor, Users, Microscope, FileText, CheckSquare, LayoutGrid, Syringe, Ambulance,
    Trash2, Plus, TestTube, Cross, ShieldPlus
} from 'lucide-react';

// Icons Mapping
// Use these constants to ensure consistency
const ICONS = {
    Brain: Brain,
    Heart: Heart,
    Lungs: Wind, // Using Wind as Lungs metaphor or Activity if more appropriate
    Kidney: Activity, // Fallback as no direct Kidney icon, using Activity or Flask
    Lab: FlaskConical, // For TestTube/Lab
    Trauma: Ambulance,
    General: BookText,
    Tube: Syringe, // Metaphor for devices/tubes
    Temperature: Thermometer,
    Fluids: Droplet
};

// --- TEMPLATES ---
// Estruturas visuais de input - Padronizadas para estilo Colapsável

export const TEMPLATES = [
    {
        id: 'anamnese_padrao',
        label: 'Anamnese Padrão',
        type: 'dynamic_kboard',
        icon: BookText
    },
    {
        id: 'soap',
        label: 'S.O.A.P.',
        type: 'structured_list',
        icon: LayoutGrid,
        sections: [
            {
                title: 'Subjetivo',
                icon: BookText,
                items: [
                    { key: '#S_Queixa', label: 'Queixa Principal (QP)', regex: /#S_Queixa:\s*(.*)/i },
                    { key: '#S_HDA', label: 'História da Doença Atual', regex: /#S_HDA:\s*(.*)/i },
                    { key: '#S_HMP', label: 'Histórico Pessoal', regex: /#S_HMP:\s*(.*)/i },
                    { key: '#S_Med', label: 'Medicações em Uso', regex: /#S_Med:\s*(.*)/i },
                    { key: '#S_Alergias', label: 'Alergias', regex: /#S_Alergias:\s*(.*)/i }
                ]
            },
            {
                title: 'Objetivo',
                icon: Stethoscope,
                items: [
                    { key: '#O_Geral', label: 'Exame Geral', regex: /#O_Geral:\s*(.*)/i },
                    { key: '#O_Sinais', label: 'Sinais Vitais', regex: /#O_Sinais:\s*(.*)/i },
                    { key: '#O_Segmentar', label: 'Exame Segmentar', regex: /#O_Segmentar:\s*(.*)/i },
                    { key: '#O_Labs', label: 'Exames Complementares', regex: /#O_Labs:\s*(.*)/i }
                ]
            },
            {
                title: 'Avaliação',
                icon: ClipboardList,
                items: [
                    { key: '#A_Resumo', label: 'Resumo do Caso', regex: /#A_Resumo:\s*(.*)/i },
                    { key: '#A_HD', label: 'Hipóteses Diagnósticas', regex: /#A_HD:\s*(.*)/i },
                    { key: '#A_Problemas', label: 'Lista de Problemas', regex: /#A_Problemas:\s*(.*)/i }
                ]
            },
            {
                title: 'Plano',
                icon: Pill,
                items: [
                    { key: '#P_Conduta', label: 'Conduta Terapêutica', regex: /#P_Conduta:\s*(.*)/i },
                    { key: '#P_Exames', label: 'Solicitação de Exames', regex: /#P_Exames:\s*(.*)/i },
                    { key: '#P_Orientacoes', label: 'Orientações', regex: /#P_Orientacoes:\s*(.*)/i }
                ]
            }
        ]
    },
    {
        id: 'systems_review',
        label: 'Revisão por Sistemas (UTI)',
        type: 'structured_list',
        icon: Activity,
        sections: [
            {
                title: 'Neurológico',
                icon: Brain,
                items: [
                    { 
                        key: '#Neuro_Avaliacao', 
                        label: 'Avaliação Neurológica', 
                        regex: /#Neuro_Avaliacao:\s*(.*)/i,
                        subitems: [
                            { key: '##Neuro_GCS', label: 'Glasgow (GCS)', regex: /##Neuro_GCS:\s*(.*)/i },
                            { key: '##Neuro_RASS', label: 'RASS', regex: /##Neuro_RASS:\s*(.*)/i },
                            { key: '##Neuro_Pupilas', label: 'Pupilas', regex: /##Neuro_Pupilas:\s*(.*)/i },
                            { key: '##Neuro_Motor', label: 'Déficit Motor', regex: /##Neuro_Motor:\s*(.*)/i }
                        ]
                    }
                ]
            },
            {
                title: 'Cardiovascular',
                icon: Heart,
                items: [
                    {
                        key: '#Cardio_Hemodinamica',
                        label: 'Hemodinâmica',
                        regex: /#Cardio_Hemodinamica:\s*(.*)/i,
                        subitems: [
                            { key: '##Cardio_PA', label: 'Pressão Arterial (PAM)', regex: /##Cardio_PA:\s*(.*)/i },
                            { key: '##Cardio_FC', label: 'Frequência Cardíaca', regex: /##Cardio_FC:\s*(.*)/i },
                            { key: '##Cardio_DVA', label: 'Drogas Vasoativas', regex: /##Cardio_DVA:\s*(.*)/i },
                            { key: '##Cardio_Perfusao', label: 'Perfusão / TEC', regex: /##Cardio_Perfusao:\s*(.*)/i }
                        ]
                    }
                ]
            },
            {
                title: 'Respiratório',
                icon: Wind, // Pulmões (Wind é o mais próximo no Lucide v0.2)
                items: [
                    {
                        key: '#Resp_Ventilacao',
                        label: 'Ventilação',
                        regex: /#Resp_Ventilacao:\s*(.*)/i,
                        subitems: [
                            { key: '##Resp_Modo', label: 'Modo Ventilatório', regex: /##Resp_Modo:\s*(.*)/i },
                            { key: '##Resp_Param', label: 'Parâmetros (FiO2/PEEP)', regex: /##Resp_Param:\s*(.*)/i },
                            { key: '##Resp_Gaso', label: 'Gasometria', regex: /##Resp_Gaso:\s*(.*)/i },
                            { key: '##Resp_Ausculta', label: 'Ausculta', regex: /##Resp_Ausculta:\s*(.*)/i }
                        ]
                    }
                ]
            },
            {
                title: 'Renal / Metabólico',
                icon: Activity, // Rins (Usando Activity/Pulse como metáfora funcional ou Bean se existisse)
                items: [
                    {
                        key: '#Renal_Balanco',
                        label: 'Função Renal',
                        regex: /#Renal_Balanco:\s*(.*)/i,
                        subitems: [
                            { key: '##Renal_Diurese', label: 'Diurese (ml/kg/h)', regex: /##Renal_Diurese:\s*(.*)/i },
                            { key: '##Renal_BH', label: 'Balanço Hídrico', regex: /##Renal_BH:\s*(.*)/i },
                            { key: '##Renal_Dialise', label: 'Diálise', regex: /##Renal_Dialise:\s*(.*)/i }
                        ]
                    },
                    {
                        key: '#Infec_Controle',
                        label: 'Infeccioso/Metabólico',
                        regex: /#Infec_Controle:\s*(.*)/i,
                        subitems: [
                            { key: '##Infec_Tax', label: 'Curva Térmica', regex: /##Infec_Tax:\s*(.*)/i },
                            { key: '##Infec_ATB', label: 'Antibióticos (Dia)', regex: /##Infec_ATB:\s*(.*)/i },
                            { key: '##Infec_Culturas', label: 'Culturas', regex: /##Infec_Culturas:\s*(.*)/i }
                        ]
                    }
                ]
            },
            {
                title: 'Dispositivos / Tubos',
                icon: Syringe, // Tubinho
                items: [
                    { key: '#Disp_Invasivos', label: 'Dispositivos Invasivos', regex: /#Disp_Invasivos:\s*(.*)/i },
                    { key: '#Disp_Acesso', label: 'Acessos Venosos', regex: /#Disp_Acesso:\s*(.*)/i }
                ]
            },
            {
                title: 'Plano Terapêutico (FAST HUG)',
                icon: ShieldPlus,
                items: [
                    {
                        key: '#Plan_FastHug',
                        label: 'Checklist FAST HUG',
                        regex: /#Plan_FastHug:\s*(.*)/i,
                        subitems: [
                            { key: '##FH_F', label: 'F - Feeding (Nutrição)', regex: /##FH_F:\s*(.*)/i },
                            { key: '##FH_A', label: 'A - Analgesia', regex: /##FH_A:\s*(.*)/i },
                            { key: '##FH_S', label: 'S - Sedation', regex: /##FH_S:\s*(.*)/i },
                            { key: '##FH_T', label: 'T - Thrombo-prophylaxis', regex: /##FH_T:\s*(.*)/i },
                            { key: '##FH_H', label: 'H - Head of Bed (Cabeceira)', regex: /##FH_H:\s*(.*)/i },
                            { key: '##FH_U', label: 'U - Ulcer Prophylaxis', regex: /##FH_U:\s*(.*)/i },
                            { key: '##FH_G', label: 'G - Glucose Control', regex: /##FH_G:\s*(.*)/i }
                        ]
                    },
                    { key: '#Plan_Conduta', label: 'Conduta Diária', regex: /#Plan_Conduta:\s*(.*)/i }
                ]
            }
        ]
    },
    {
        id: 'trauma_xabcde',
        label: 'Protocolo Trauma (XABCDE)',
        type: 'structured_list',
        icon: Ambulance,
        sections: [
            {
                title: 'X - Exsanguinação',
                icon: Droplet,
                items: [
                    {
                        key: '#X_Controle',
                        label: 'Controle de Hemorragia',
                        regex: /#X_Controle:\s*(.*)/i,
                        subitems: [
                            { key: '##X_Torniquete', label: 'Torniquete', regex: /##X_Torniquete:\s*(.*)/i },
                            { key: '##X_Compressao', label: 'Compressão Direta', regex: /##X_Compressao:\s*(.*)/i }
                        ]
                    }
                ]
            },
            {
                title: 'A - Vias Aéreas',
                icon: Wind,
                items: [
                    {
                        key: '#A_Avaliacao',
                        label: 'Vias Aéreas e Cervical',
                        regex: /#A_Avaliacao:\s*(.*)/i,
                        subitems: [
                            { key: '##A_Perviedade', label: 'Perviedade', regex: /##A_Perviedade:\s*(.*)/i },
                            { key: '##A_Colar', label: 'Colar Cervical', regex: /##A_Colar:\s*(.*)/i },
                            { key: '##A_Definitiva', label: 'Via Aérea Definitiva', regex: /##A_Definitiva:\s*(.*)/i }
                        ]
                    }
                ]
            },
            {
                title: 'B - Respiração',
                icon: Activity, // Could use Lungs/Wind here too, but Activity is standard for Vital Signs/Breathing pattern
                items: [
                    {
                        key: '#B_Ventilacao',
                        label: 'Ventilação e Trocas',
                        regex: /#B_Ventilacao:\s*(.*)/i,
                        subitems: [
                            { key: '##B_Expansao', label: 'Expansibilidade', regex: /##B_Expansao:\s*(.*)/i },
                            { key: '##B_Murmurio', label: 'Murmúrio Vesicular', regex: /##B_Murmurio:\s*(.*)/i },
                            { key: '##B_SatO2', label: 'Saturação O2', regex: /##B_SatO2:\s*(.*)/i }
                        ]
                    }
                ]
            },
            {
                title: 'C - Circulação',
                icon: Heart,
                items: [
                    {
                        key: '#C_Hemodinamica',
                        label: 'Estado Circulatório',
                        regex: /#C_Hemodinamica:\s*(.*)/i,
                        subitems: [
                            { key: '##C_Pulsos', label: 'Pulsos', regex: /##C_Pulsos:\s*(.*)/i },
                            { key: '##C_Perfusao', label: 'Perfusão', regex: /##C_Perfusao:\s*(.*)/i },
                            { key: '##C_FAST', label: 'E-FAST / POCUS', regex: /##C_FAST:\s*(.*)/i }
                        ]
                    }
                ]
            },
            {
                title: 'D - Neurológico',
                icon: Eye,
                items: [
                    {
                        key: '#D_Neuro',
                        label: 'Exame Neurológico',
                        regex: /#D_Neuro:\s*(.*)/i,
                        subitems: [
                            { key: '##D_GCS', label: 'Glasgow', regex: /##D_GCS:\s*(.*)/i },
                            { key: '##D_Pupilas', label: 'Pupilas', regex: /##D_Pupilas:\s*(.*)/i }
                        ]
                    }
                ]
            },
            {
                title: 'E - Exposição',
                icon: Bone,
                items: [
                    {
                        key: '#E_Geral',
                        label: 'Exposição e Ambiente',
                        regex: /#E_Geral:\s*(.*)/i,
                        subitems: [
                            { key: '##E_Lesoes', label: 'Lesões Visíveis', regex: /##E_Lesoes:\s*(.*)/i },
                            { key: '##E_Temp', label: 'Controle Térmico', regex: /##E_Temp:\s*(.*)/i }
                        ]
                    }
                ]
            }
        ]
    }
];


// --- CONTEXTS ---
// Cenários que o usuário seleciona. Cada um aponta para um template preferencial.

export const CONTEXTS = [
    {
        id: 'registro_geral',
        label: 'Novo Registro',
        defaultTemplateId: 'anamnese_padrao',
        icon: FileText
    },
    {
        id: 'anamnese_padrao',
        label: 'Anamnese / Evolução',
        defaultTemplateId: 'anamnese_padrao',
        icon: BookText
    },
    {
        id: 'uti_adulto',
        label: 'UTI Adulto',
        defaultTemplateId: 'systems_review',
        icon: Activity
    },
    {
        id: 'sala_emergencia',
        label: 'Sala Vermelha / Trauma',
        defaultTemplateId: 'trauma_xabcde',
        icon: Ambulance
    },
    {
        id: 'pronto_socorro',
        label: 'Pronto Socorro (PS)',
        defaultTemplateId: 'anamnese_padrao',
        icon: Stethoscope
    },
    {
        id: 'triagem',
        label: 'Triagem / Classificação',
        defaultTemplateId: 'manchester',
        icon: ClipboardList
    },
    {
        id: 'teleconsulta',
        label: 'Teleconsulta',
        defaultTemplateId: 'anamnese_padrao',
        icon: Monitor
    },
    {
        id: 'ambulatorio',
        label: 'Ambulatório',
        defaultTemplateId: 'anamnese_padrao',
        icon: Users
    },
    {
        id: 'exames',
        label: 'Solicitação / Resultado',
        defaultTemplateId: 'anamnese_padrao',
        icon: Microscope
    }
];

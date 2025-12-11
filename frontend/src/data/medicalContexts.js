import { 
  BookText, 
  Activity, 
  Ambulance, 
  Stethoscope, 
  ClipboardList, 
  Monitor, 
  Users, 
  Microscope, 
  Brain, 
  Heart, 
  Wind, 
  Thermometer, 
  Droplet, 
  Eye, 
  Bone 
} from 'lucide-react';

export const CONTEXTS = [
  {
    id: 'anamnese_padrao', // Keeping ID consistent with user request or mapping it
    label: 'Anamnese / Consultório',
    defaultTemplateId: 'anamnese_padrao',
    icon: BookText
  },
  {
    id: 'uti_adulto',
    label: 'UTI / Intensiva',
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
    defaultTemplateId: 'manchester', // Fallback to flat if not implemented yet
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

export const TEMPLATES = {
  anamnese_padrao: {
    id: 'anamnese_padrao',
    label: 'Lista Simples (Padrão)',
    type: 'flat',
    description: 'Lista tradicional de tags agrupadas por categoria'
  },
  systems_review: {
    id: 'systems_review',
    label: 'Por Sistemas (UTI)',
    type: 'accordion',
    description: 'Avaliação detalhada por sistemas orgânicos',
    sections: [
      {
        title: 'Neurológico',
        icon: Brain,
        items: [
          { key: 'neuro_gcs', label: 'Glasgow (GCS)', type: 'score' },
          { key: 'neuro_rass', label: 'RASS', type: 'score' },
          { key: 'neuro_pupilas', label: 'Pupilas / Fotomotor', type: 'select' },
          { key: 'neuro_deficit', label: 'Déficit Motor/Sensitivo', type: 'check' }
        ]
      },
      {
        title: 'Cardiovascular',
        icon: Heart,
        items: [
          { key: 'cardio_pa', label: 'PAM / PA Invasiva', type: 'number' },
          { key: 'cardio_fc', label: 'Frequência Cardíaca', type: 'number' },
          { key: 'cardio_dva', label: 'Drogas Vasoativas', type: 'list' },
          { key: 'cardio_perfusao', label: 'Perfusão / TEC', type: 'text' },
          { key: 'cardio_lactato', label: 'Lactato', type: 'number' }
        ]
      },
      {
        title: 'Respiratório',
        icon: Wind,
        items: [
          { key: 'resp_dispositivo', label: 'Dispositivo (TOT/TQT/VNI)', type: 'select' },
          { key: 'resp_vm_params', label: 'Parâmetros VM', type: 'group' },
          { key: 'resp_gaso', label: 'Gasometria', type: 'group' },
          { key: 'resp_ausculta', label: 'Ausculta Pulmonar', type: 'text' }
        ]
      },
      {
        title: 'Infeccioso / Metabólico',
        icon: Thermometer,
        items: [
          { key: 'inf_tax', label: 'Curva Térmica (Tax)', type: 'chart' },
          { key: 'inf_atb', label: 'Antibióticos', type: 'list' },
          { key: 'renal_bh', label: 'Balanço Hídrico', type: 'number' },
          { key: 'renal_diurese', label: 'Diurese', type: 'number' }
        ]
      }
    ]
  },
  trauma_xabcde: {
    id: 'trauma_xabcde',
    label: 'Protocolo XABCDE',
    type: 'protocol',
    description: 'Protocolo de trauma ATLS',
    sections: [
      {
        title: 'X - Hemorragia Exsanguinante',
        icon: Droplet,
        color: 'text-red-600',
        items: [
          { key: 'trauma_x_contencao', label: 'Contenção de Sangramento', type: 'action' },
          { key: 'trauma_x_torniquete', label: 'Torniquete Aplicado', type: 'check' }
        ]
      },
      {
        title: 'A - Vias Aéreas',
        icon: Wind,
        items: [
          { key: 'trauma_a_perviedade', label: 'Perviedade / Colar', type: 'check' },
          { key: 'trauma_a_iot', label: 'Via Aérea Definitiva', type: 'action' }
        ]
      },
      {
        title: 'B - Respiração',
        icon: Activity,
        items: [
          { key: 'trauma_b_murmurio', label: 'Murmúrio / Expansibilidade', type: 'text' },
          { key: 'trauma_b_sato2', label: 'Saturação O2', type: 'number' }
        ]
      },
      {
        title: 'C - Circulação',
        icon: Heart,
        items: [
          { key: 'trauma_c_pulsos', label: 'Pulsos / Perfusão', type: 'text' },
          { key: 'trauma_c_fast', label: 'E-FAST / POCUS', type: 'exam' }
        ]
      },
      {
        title: 'D - Neurológico',
        icon: Eye,
        items: [
          { key: 'trauma_d_glasgow', label: 'Glasgow', type: 'score' },
          { key: 'trauma_d_pupilas', label: 'Pupilas', type: 'select' }
        ]
      },
      {
        title: 'E - Exposição',
        icon: Bone,
        items: [
          { key: 'trauma_e_lesoes', label: 'Inspeção / Lesões', type: 'text' },
          { key: 'trauma_e_hipotermia', label: 'Prevenção Hipotermia', type: 'check' }
        ]
      }
    ]
  },
  soap: {
    id: 'soap',
    label: 'SOAP',
    type: 'soap',
    description: 'Subjetivo, Objetivo, Avaliação, Plano'
  }
};

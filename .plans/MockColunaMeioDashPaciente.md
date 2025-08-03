import React, { useState, useMemo } from 'react';
import { PlusCircle, UserCircle, FileText, AlertTriangle, Pill, HeartPulse, Microscope, Image as ImageIcon, Clock, Target, TestTube, ArrowRight, Search, Beaker, NotebookPen, History } from 'lucide-react';

// --- TIPOS DE DADOS (MOCK) ---
type PacienteInfo = {
  nome: string;
  idade: number;
  id: string;
  prontuario: string;
};

type PlanoTerapeuticoAtivo = {
    id: string;
    tratamento: string;
    meta: string;
    statusAtual: string;
    corStatus: 'success' | 'warning' | 'danger';
};

type ItemHistorico = {
  id: string;
  data: string;
  hora: string;
  tipo: 'Consulta' | 'Pedido de Exame' | 'Resultado de Exame' | 'Prescrição' | 'Orientação';
  descricao: string;
  contexto: 'Ambulatório' | 'Emergência' | 'UTI' | 'Internação';
  medico: string;
};

// --- DADOS INICIAIS (MOCK) ---
const pacienteInfo: PacienteInfo = {
  nome: 'João Silva',
  idade: 45,
  id: '12345',
  prontuario: '789012',
};

const planoTerapeuticoAtivo: PlanoTerapeuticoAtivo[] = [
    { id: 'p1', tratamento: 'Controle de HAS', meta: 'PA < 130/80 mmHg', statusAtual: 'PA atual: 140/90 mmHg', corStatus: 'warning' },
    { id: 'p2', tratamento: 'Controle de Dislipidemia', meta: 'LDL < 100 mg/dL', statusAtual: 'LDL atual: 95 mg/dL', corStatus: 'success' },
];

const informacoesClinicas = {
  problemas: ['Hipertensão Arterial Sistêmica (HAS)', 'Dislipidemia'],
  alergias: ['Penicilina'],
  medicamentos: ['Losartana 50mg', 'Sinvastatina 20mg'],
};

const historicoCompleto: ItemHistorico[] = [
  { id: 'h1', data: '28/07/2025', hora: '09:30', tipo: 'Pedido de Exame', descricao: 'ECG de 12 derivações, Troponina I seriada', contexto: 'Emergência', medico: 'Dr. Carlos' },
  { id: 'h2', data: '28/07/2025', hora: '09:15', tipo: 'Consulta', descricao: 'Atendimento de Emergência - Dor torácica', contexto: 'Emergência', medico: 'Dr. Carlos' },
  { id: 'h3', data: '25/07/2025', hora: '11:00', tipo: 'Resultado de Exame', descricao: 'Raio-X de Tórax: Sem alterações agudas.', contexto: 'Ambulatório', medico: 'Dr. House' },
  { id: 'h4', data: '22/04/2025', hora: '14:30', tipo: 'Prescrição', descricao: 'Ajuste de dose: Losartana 100mg', contexto: 'Ambulatório', medico: 'Dr. Carlos' },
  { id: 'h5', data: '22/04/2025', hora: '14:30', tipo: 'Orientação', descricao: 'Orientado a aferir PA diariamente.', contexto: 'Ambulatório', medico: 'Dr. Carlos' },
  { id: 'h6', data: '22/04/2025', hora: '14:30', tipo: 'Consulta', descricao: 'Retorno - Acompanhamento HAS', contexto: 'Ambulatório', medico: 'Dr. Carlos' },
  { id: 'h7', data: '05/01/2025', hora: '10:00', tipo: 'Pedido de Exame', descricao: 'Hemograma Completo, Perfil Lipídico', contexto: 'Ambulatório', medico: 'Dr. Carlos' },
  { id: 'h8', data: '05/01/2025', hora: '10:00', tipo: 'Consulta', descricao: 'Primeira Consulta - Check-up', contexto: 'Ambulatório', medico: 'Dr. Carlos' },
];

const statusColors = {
    success: 'text-green-400',
    warning: 'text-amber-400',
    danger: 'text-red-400',
};

// --- SUBCOMPONENTES ---
const InfoCard = ({ title, children }) => (
    <div className="bg-[#1C1C1F] p-5 rounded-lg border border-gray-800">
        <h3 className="font-semibold text-lg text-white mb-4">{title}</h3>
        {children}
    </div>
);

const TimelineItem = ({ item }) => {
    const iconMap = {
        'Consulta': <FileText size={18}/>,
        'Pedido de Exame': <Beaker size={18}/>,
        'Resultado de Exame': <Microscope size={18}/>,
        'Prescrição': <Pill size={18}/>,
        'Orientação': <NotebookPen size={18}/>,
    };

    return (
        <div className="relative pl-8 py-2 group">
            <div className="absolute left-0 top-4 w-px h-full bg-gray-700"></div>
            <div className="absolute left-[-5px] top-4 w-4 h-4 bg-gray-700 rounded-full border-4 border-[#111113] group-hover:bg-blue-500 transition-colors"></div>
            <div className="bg-[#1C1C1F] p-4 rounded-lg border border-gray-800 transition-all hover:border-blue-500/50 hover:bg-gray-800/20 cursor-pointer">
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <p className="text-sm text-gray-400">{item.data} às {item.hora} • {item.contexto}</p>
                        <h3 className="font-semibold text-white mt-1">{item.descricao}</h3>
                        <p className="text-xs text-gray-500 mt-1">Registrado por: {item.medico}</p>
                    </div>
                    <div className="text-blue-400 flex-shrink-0 mt-1" title={item.tipo}>
                        {iconMap[item.tipo] || <FileText size={18}/>}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
const DashboardSofisticado = () => {
  const [activeTab, setActiveTab] = useState<'historico' | 'investigacao' | 'planos'>('historico');
  const [searchTerm, setSearchTerm] = useState('');

  const handleNovoRegistroClick = () => {
    alert('Navegando para a tela de novo registro...');
  };

  const filteredData = useMemo(() => {
    let data = historicoCompleto;

    if (activeTab === 'investigacao') {
      data = historicoCompleto.filter(item => item.tipo === 'Pedido de Exame' || item.tipo === 'Resultado de Exame');
    } else if (activeTab === 'planos') {
      data = historicoCompleto.filter(item => item.tipo === 'Prescrição' || item.tipo === 'Orientação');
    }

    if (searchTerm) {
      return data.filter(item => 
        item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.contexto.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return data;
  }, [activeTab, searchTerm]);

  const TabButton = ({ tabId, icon, label }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
        activeTab === tabId
          ? 'bg-blue-600/20 text-blue-300'
          : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#111113] text-gray-300 font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center pb-4 mb-8 border-b border-gray-800">
          <UserCircle size={48} className="text-blue-400 mr-4"/>
          <div>
              <h1 className="text-2xl font-bold text-gray-100">{pacienteInfo.nome}, {pacienteInfo.idade} anos</h1>
              <p className="text-gray-500">ID: {pacienteInfo.id} | Prontuário: {pacienteInfo.prontuario}</p>
          </div>
        </header>
        
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#1C1C1F] p-2 rounded-lg border border-gray-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-2 p-1 bg-gray-900/50 rounded-lg">
                    <TabButton tabId="historico" icon={<History size={16}/>} label="Linha do Tempo"/>
                    <TabButton tabId="investigacao" icon={<Beaker size={16}/>} label="Investigação"/>
                    <TabButton tabId="planos" icon={<NotebookPen size={16}/>} label="Planos e Condutas"/>
                </div>
                <div className="relative w-full sm:w-auto">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                    <input 
                        type="text"
                        placeholder="Buscar na linha do tempo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800/60 border border-gray-700 rounded-md pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                </div>
            </div>

            <div className="space-y-0 min-h-[400px]">
                {filteredData.map((item) => <TimelineItem key={item.id} item={item} />)}
                {filteredData.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        <p>Nenhum item encontrado.</p>
                        <p className="text-sm">Tente ajustar sua busca ou o filtro de abas.</p>
                    </div>
                )}
            </div>
          </div>

          <aside className="lg:col-span-1 space-y-8">
             <button 
                onClick={handleNovoRegistroClick}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ease-in-out shadow-sm hover:shadow-md hover:shadow-blue-500/30 transform hover:-translate-y-px"
            >
                <PlusCircle size={18} /> Iniciar Novo Registro
            </button>
            
            <InfoCard title="Plano Terapêutico Ativo">
                {planoTerapeuticoAtivo.map(plano => (
                    <div key={plano.id} className="mb-4 last:mb-0">
                        <h4 className="font-semibold text-white">{plano.tratamento}</h4>
                        <div className="text-sm mt-2 flex items-center gap-2">
                            <Target size={16} className="text-blue-400"/>
                            <span className="text-gray-400">Meta:</span>
                            <span>{plano.meta}</span>
                        </div>
                        <div className={`text-sm mt-1 flex items-center gap-2 ${statusColors[plano.corStatus]}`}>
                            <ArrowRight size={16}/>
                            <span className="text-gray-400">Status:</span>
                            <span>{plano.statusAtual}</span>
                        </div>
                    </div>
                ))}
            </InfoCard>

            <InfoCard title="Resumo Clínico">
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-semibold text-gray-400 flex items-center gap-2 mb-2"><HeartPulse size={16} /> Problemas Ativos</p>
                        <ul className="space-y-1 text-sm list-disc list-inside text-gray-300">
                            {informacoesClinicas.problemas.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                    <div className="pt-4 border-t border-gray-800">
                        <p className="text-sm font-semibold text-gray-400 flex items-center gap-2 mb-2"><AlertTriangle size={16} /> Alergias</p>
                        <ul className="space-y-1 text-sm list-disc list-inside text-gray-300">
                            {informacoesClinicas.alergias.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                    <div className="pt-4 border-t border-gray-800">
                        <p className="text-sm font-semibold text-gray-400 flex items-center gap-2 mb-2"><Pill size={16} /> Medicamentos</p>
                        <ul className="space-y-1 text-sm list-disc list-inside text-gray-300">
                            {informacoesClinicas.medicamentos.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                </div>
            </InfoCard>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default DashboardSofisticado;

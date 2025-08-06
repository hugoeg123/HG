import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePatientStore } from '../../store/patientStore';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import SidebarItem from '../ui/SidebarItem';
import { 
  BookOpen, 
  FileText, 
  Pill, 
  Stethoscope, 
  Activity, 
  Calculator,
  Search,
  Lightbulb
} from 'lucide-react';

/**
 * KnowledgeBase component - Exibe uma base de conhecimento médico
 * 
 * @component
 * @example
 * return (
 *   <KnowledgeBase />
 * )
 */
const KnowledgeBase = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const { currentPatient } = usePatientStore();

  // Dados simulados para a base de conhecimento
  // Em uma implementação real, estes dados viriam de uma API
  const knowledgeItems = [
    {
      id: 1,
      title: 'Diretrizes para Hipertensão',
      description: 'Diretrizes atualizadas para diagnóstico e tratamento de hipertensão arterial',
      category: 'guidelines',
      tags: ['hipertensão', 'cardiologia', 'pressão arterial'],
      url: '/knowledge/guidelines/hypertension',
      icon: BookOpen,
      color: 'text-blue-400'
    },
    {
      id: 2,
      title: 'Calculadora de Risco Cardiovascular',
      description: 'Como utilizar a calculadora de risco cardiovascular para avaliação de pacientes',
      category: 'tools',
      tags: ['risco cardiovascular', 'cardiologia', 'prevenção'],
      url: '/knowledge/tools/cardiovascular-risk',
      icon: Calculator,
      color: 'text-green-400'
    },
    {
      id: 3,
      title: 'Protocolo de Diabetes Tipo 2',
      description: 'Protocolo clínico para manejo de pacientes com diabetes mellitus tipo 2',
      category: 'protocols',
      tags: ['diabetes', 'endocrinologia', 'glicemia'],
      url: '/knowledge/protocols/diabetes-type-2',
      icon: FileText,
      color: 'text-purple-400'
    },
    {
      id: 4,
      title: 'Interações Medicamentosas Comuns',
      description: 'Lista de interações medicamentosas frequentes e como evitá-las',
      category: 'medications',
      tags: ['medicamentos', 'interações', 'farmacologia'],
      url: '/knowledge/medications/interactions',
      icon: Pill,
      color: 'text-orange-400'
    },
    {
      id: 5,
      title: 'Interpretação de Exames Laboratoriais',
      description: 'Guia para interpretação de resultados de exames laboratoriais comuns',
      category: 'diagnostics',
      tags: ['laboratório', 'exames', 'diagnóstico'],
      url: '/knowledge/diagnostics/lab-tests',
      icon: Stethoscope,
      color: 'text-cyan-400'
    },
    {
      id: 6,
      title: 'Manejo da Dor Crônica',
      description: 'Abordagens atuais para o manejo da dor crônica em diferentes contextos',
      category: 'treatments',
      tags: ['dor', 'analgesia', 'tratamento'],
      url: '/knowledge/treatments/chronic-pain',
      icon: Activity,
      color: 'text-red-400'
    },
  ];

  // Categorias disponíveis
  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'guidelines', name: 'Diretrizes' },
    { id: 'protocols', name: 'Protocolos' },
    { id: 'medications', name: 'Medicamentos' },
    { id: 'diagnostics', name: 'Diagnósticos' },
    { id: 'treatments', name: 'Tratamentos' },
    { id: 'tools', name: 'Ferramentas' },
  ];

  // Filtrar itens com base na pesquisa e categoria
  const filteredItems = knowledgeItems.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Sugestões baseadas no paciente atual
  const patientBasedSuggestions = () => {
    if (!currentPatient) return [];
    
    // Em uma implementação real, você usaria os dados do paciente para gerar sugestões relevantes
    // Aqui estamos simulando algumas sugestões baseadas em condições hipotéticas
    const suggestions = [];
    
    // Exemplo: se o nome do paciente contiver "Silva", sugerir conteúdo sobre hipertensão
    if (currentPatient.name.includes('Silva')) {
      suggestions.push(knowledgeItems.find(item => item.tags.includes('hipertensão')));
    }
    
    // Exemplo: se o paciente tiver mais de 40 anos, sugerir conteúdo sobre risco cardiovascular
    if (currentPatient.age > 40) {
      suggestions.push(knowledgeItems.find(item => item.tags.includes('risco cardiovascular')));
    }
    
    return suggestions.filter(Boolean); // Remover itens undefined
  };

  const suggestions = patientBasedSuggestions();

  return (
    <div className="space-y-4">
      {/* Description */}
      <div>
        <p className="text-gray-300 text-sm">
          Acesse diretrizes, protocolos e ferramentas médicas
        </p>
      </div>

      {/* Campo de pesquisa */}
      <div className="relative">
        <input
          type="text"
          placeholder="Pesquisar na base de conhecimento..."
          className="w-full pl-9 pr-4 py-2 bg-theme-card border border-theme-border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
      </div>

      {/* Categorias - Usando SidebarItem para consistência */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {categories.map(category => (
          <SidebarItem
            key={category.id}
            isActive={activeCategory === category.id}
            title={category.name}
            onClick={() => setActiveCategory(category.id)}
            className="text-center py-2 px-3"
          />
        ))}
      </div>

      {/* Sugestões baseadas no paciente */}
      {currentPatient && suggestions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-yellow-400" />
            <h4 className="text-white font-medium">Sugestões para {currentPatient.name}</h4>
          </div>
          <div className="space-y-3">
            {suggestions.map(item => {
              const IconComponent = item.icon;
              return (
                <Link key={item.id} to={item.url} className="block">
                  <SidebarItem
                    isActive={false}
                    title={item.title}
                    subtitle={item.description}
                    icon={<IconComponent className={`h-5 w-5 ${item.color}`} />}
                    onClick={() => {}}
                    className="border-teal-500/30 bg-teal-900/10 hover:bg-teal-900/20 hover:border-teal-400/50"
                  >
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {item.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs bg-teal-800/30 text-teal-200 border-teal-600/50 hover:bg-teal-700/40 transition-colors">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </SidebarItem>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista de itens */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <Card className="bg-theme-card border-theme-border">
            <CardContent className="text-center py-8">
              <Search className="h-8 w-8 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400">Nenhum resultado encontrado</p>
              <p className="text-gray-500 text-sm mt-1">Tente ajustar os filtros ou termos de busca</p>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map(item => {
            const IconComponent = item.icon;
            return (
              <Link key={item.id} to={item.url} className="block">
                <SidebarItem
                  isActive={false}
                  title={item.title}
                  subtitle={item.description}
                  icon={<IconComponent className={`h-5 w-5 ${item.color}`} />}
                  onClick={() => {}}
                >
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {item.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs bg-gray-700/50 text-gray-300 border-gray-600/50 hover:bg-gray-600/50 hover:text-white transition-all duration-200">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </SidebarItem>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;

// Conector: Integra com RightSidebar.jsx para exibição na interface
// Nota: Em uma implementação real, este componente se integraria com uma API de conhecimento médico
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePatientStore } from '../../store/patientStore';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';

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
    },
    {
      id: 2,
      title: 'Calculadora de Risco Cardiovascular',
      description: 'Como utilizar a calculadora de risco cardiovascular para avaliação de pacientes',
      category: 'tools',
      tags: ['risco cardiovascular', 'cardiologia', 'prevenção'],
      url: '/knowledge/tools/cardiovascular-risk',
    },
    {
      id: 3,
      title: 'Protocolo de Diabetes Tipo 2',
      description: 'Protocolo clínico para manejo de pacientes com diabetes mellitus tipo 2',
      category: 'protocols',
      tags: ['diabetes', 'endocrinologia', 'glicemia'],
      url: '/knowledge/protocols/diabetes-type-2',
    },
    {
      id: 4,
      title: 'Interações Medicamentosas Comuns',
      description: 'Lista de interações medicamentosas frequentes e como evitá-las',
      category: 'medications',
      tags: ['medicamentos', 'interações', 'farmacologia'],
      url: '/knowledge/medications/interactions',
    },
    {
      id: 5,
      title: 'Interpretação de Exames Laboratoriais',
      description: 'Guia para interpretação de resultados de exames laboratoriais comuns',
      category: 'diagnostics',
      tags: ['laboratório', 'exames', 'diagnóstico'],
      url: '/knowledge/diagnostics/lab-tests',
    },
    {
      id: 6,
      title: 'Manejo da Dor Crônica',
      description: 'Abordagens atuais para o manejo da dor crônica em diferentes contextos',
      category: 'treatments',
      tags: ['dor', 'analgesia', 'tratamento'],
      url: '/knowledge/treatments/chronic-pain',
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
    <div className="knowledge-base-container h-full flex flex-col">
      {/* Description */}
      <div className="mb-4">
        <p className="text-gray-300 text-sm">
          Acesse diretrizes, protocolos e ferramentas médicas
        </p>
      </div>

      {/* Campo de pesquisa */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Pesquisar na base de conhecimento..."
          className="input w-full pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 absolute left-2 top-2.5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Categorias */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map(category => (
          <Badge
            key={category.id}
            variant={activeCategory === category.id ? 'default' : 'outline'}
            className={`cursor-pointer transition-colors ${
              activeCategory === category.id 
                ? 'bg-primary text-primary-foreground hover:bg-primary/80' 
                : 'hover:bg-secondary/20'
            }`}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.name}
          </Badge>
        ))}
      </div>

      {/* Sugestões baseadas no paciente */}
      {currentPatient && suggestions.length > 0 && (
        <div className="mb-6">
          <h4 className="text-white font-medium mb-2">Sugestões para {currentPatient.name}</h4>
          <div className="space-y-3">
            {suggestions.map(item => (
              <Link key={item.id} to={item.url} className="block">
                <Card className="hover:bg-theme-card/50 transition-colors border-teal-800 bg-teal-900/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-base">{item.title}</CardTitle>
                    <CardDescription className="text-gray-300">{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs bg-teal-800/50 text-teal-200 border-teal-700">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Lista de itens */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <Card className="bg-gray-700/30">
            <CardContent className="text-center py-6">
              <p className="text-gray-400">Nenhum resultado encontrado</p>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map(item => (
            <Link key={item.id} to={item.url} className="block">
              <Card className="hover:bg-theme-card/50 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base">{item.title}</CardTitle>
                  <CardDescription className="text-gray-300">{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs bg-gray-600/50 text-gray-300 border-gray-600">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;

// Conector: Integra com RightSidebar.jsx para exibição na interface
// Nota: Em uma implementação real, este componente se integraria com uma API de conhecimento médico
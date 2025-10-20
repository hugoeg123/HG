import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Calculator, Droplets, Activity, ArrowRight } from 'lucide-react';

/**
 * CalculatorsIndex - Página índice das calculadoras disponíveis
 * 
 * Integrates with:
 * - React Router para navegação entre calculadoras
 * - components/ui/* para componentes shadcn
 * - Layout principal do aplicativo
 * 
 * @component
 * @example
 * return (
 *   <CalculatorsIndex />
 * )
 * 
 * Hook: Página índice para navegação entre calculadoras
 * IA prompt: Adicionar busca, categorização e favoritos
 */
const CalculatorsIndex: React.FC = () => {
  const calculators = [
    {
      id: 'gotejamento',
      title: 'Conversão de Gotejamento',
      description: 'Converte entre gotas/min e mL/h com contador manual',
      category: 'Conversões',
      icon: Droplets,
      path: '/calculators/gotejamento',
      color: 'emerald'
    },
    {
      id: 'mcg-kg-min-gtt',
      title: 'Conversão mcg/kg/min ↔ gtt/min',
      description: 'Conversão de doses por peso para gotejamento',
      category: 'Conversões',
      icon: Activity,
      path: '/calculators/mcg-kg-min-gtt',
      color: 'teal'
    }
  ];

  const getColorClasses = (color: string) => {
    // Semantic accent tokens for consistent theming across dark/bright modes
    // Conector: Consumed by button/icon/border in this page; integrates with index.css theme variables
    switch (color) {
      case 'emerald':
      case 'teal':
      default:
        return {
          icon: 'text-accent',
          border: 'border-accent/30',
          hover: 'hover:border-accent/50',
          // Solid accent fill for button: blue (light) / green/teal (dark)
          button: 'bg-accent text-accent-foreground hover:bg-accent/90'
        };
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Calculator className="h-8 w-8 text-accent" />
          <h1 className="text-3xl font-bold text-foreground">Calculadoras Médicas</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Ferramentas de cálculo para apoio à prática clínica. Todas as calculadoras seguem
          protocolos estabelecidos e incluem disclaimers de responsabilidade.
        </p>
      </div>

      {/* Grid de Calculadoras */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {calculators.map((calc) => {
          const Icon = calc.icon;
          const colors = getColorClasses(calc.color);
          
          return (
            <Card 
              key={calc.id} 
              className={`bg-theme-card border-theme-border ${colors.border} ${colors.hover} transition-all duration-200 hover:shadow-lg`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-6 w-6 ${colors.icon}`} />
                    <div>
                      <CardTitle className="text-foreground text-lg">{calc.title}</CardTitle>
                      <div className="text-sm text-muted-foreground mt-1">{calc.category}</div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  {calc.description}
                </p>
                
                <Link to={calc.path}>
                  <Button 
                    className={`w-full ${colors.button} border border-transparent hover:border-accent/30 transition-all duration-200`}
                  >
                    <span>Abrir Calculadora</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-12">
        <Card className="bg-amber-900/20 border-amber-700/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Calculator className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-amber-300 font-semibold mb-2">Importante</h3>
                <p className="text-amber-200 text-sm leading-relaxed">
                  Todas as calculadoras são ferramentas de apoio e não substituem o julgamento clínico.
                  Sempre verifique os resultados e consulte protocolos institucionais antes da aplicação clínica.
                  Os cálculos seguem fórmulas padronizadas e incluem referências bibliográficas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CalculatorsIndex;

// Connector: Integra com sistema de roteamento do React Router
// Hook: Página índice para navegação entre calculadoras disponíveis
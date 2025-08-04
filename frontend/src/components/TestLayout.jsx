import React from 'react';

/**
 * Componente de teste para verificar se o Tailwind CSS está funcionando
 * e se o layout de 3 colunas está sendo renderizado corretamente
 */
const TestLayout = () => {
  return (
    <div className="h-screen bg-darkBg text-white p-4">
      <h1 className="text-2xl font-bold mb-4 text-teal-500">Teste do Layout - Health Guardian</h1>
      
      {/* Teste do grid de 3 colunas */}
      <div className="grid grid-cols-3 gap-4 h-96 mb-6">
        <div className="bg-lightBg border-2 border-red-500 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Coluna 1 - LeftSidebar</h2>
          <p className="text-gray-300">Esta é a coluna esquerda onde ficam os pacientes.</p>
          <div className="mt-4 space-y-2">
            <div className="bg-gray-700 p-2 rounded">João Silva</div>
            <div className="bg-gray-700 p-2 rounded">Maria Oliveira</div>
            <div className="bg-gray-700 p-2 rounded">Carlos Santos</div>
          </div>
        </div>
        
        <div className="bg-lightBg border-2 border-green-500 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Coluna 2 - Centro</h2>
          <p className="text-gray-300">Esta é a coluna central onde fica o editor de prontuários.</p>
          <div className="mt-4 bg-gray-800 p-4 rounded h-32">
            <p className="text-sm">Editor de texto aqui...</p>
          </div>
        </div>
        
        <div className="bg-lightBg border-2 border-teal-500 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Coluna 3 - RightSidebar</h2>
          <p className="text-gray-300">Esta é a coluna direita onde fica o assistente IA.</p>
          <div className="mt-4 space-y-2">
            <div className="bg-teal-900 p-2 rounded text-sm">Chat IA</div>
          <div className="bg-teal-800 p-2 rounded text-sm">Calculadoras</div>
            <div className="bg-yellow-900 p-2 rounded text-sm">Alertas</div>
          </div>
        </div>
      </div>
      
      {/* Teste de classes Tailwind customizadas */}
      <div className="bg-darkBg border border-border p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Teste de Classes Customizadas</h3>
        <div className="flex space-x-4">
          <button className="btn btn-primary">Botão Primário</button>
          <button className="btn btn-secondary">Botão Secundário</button>
          <input 
            id="test-input"
            name="testInput"
            className="input" 
            placeholder="Campo de entrada"
            aria-label="Campo de teste de entrada"
          />
        </div>
      </div>
      
      {/* Indicador de status */}
      <div className="mt-4 p-4 bg-green-900 bg-opacity-50 border border-green-500 rounded-lg">
        <p className="text-green-300 font-semibold">✅ Se você está vendo este layout com cores e espaçamento corretos, o Tailwind CSS está funcionando!</p>
      </div>
    </div>
  );
};

export default TestLayout;
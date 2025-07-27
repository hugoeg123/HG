# Documentação da Aba de Calculadoras

## Estado Atual

Este componente (`Calculators.jsx`) é o ponto de entrada para as ferramentas de cálculo disponíveis na aplicação. Ele pode listar diferentes calculadoras e, possivelmente, carregar componentes de calculadora específicos (como `CalculatorModal.jsx`) com base na seleção do usuário.

## Estado Desejado

O objetivo é que esta aba seja um hub centralizado para todas as calculadoras médicas e de saúde, oferecendo uma interface clara para o usuário selecionar e utilizar as ferramentas. Deve ser facilmente extensível para adicionar novas calculadoras sem impactar as existentes.

## Correlações e Codependências

- **`CalculatorModal.jsx`**: Componente modal que provavelmente contém a lógica e a UI de uma calculadora específica.
- **Backend API**: Algumas calculadoras podem precisar interagir com o backend para obter dados, realizar cálculos complexos ou salvar resultados. (Ex: `/api/calculations`)
- **Componentes de UI**: Utiliza componentes de UI genéricos (ex: botões, inputs, modais) definidos em `frontend/src/components/ui`.

## Funções Principais

- `loadCalculator(calculatorType)`: Carrega o componente ou modal da calculadora selecionada.
- `displayCalculatorList()`: Renderiza a lista de calculadoras disponíveis.

## Como Editar esta Aba

Para editar o comportamento ou a aparência da aba de Calculadoras, você precisará modificar o arquivo `Calculators.jsx` e, possivelmente, os componentes de calculadora individuais (como `CalculatorModal.jsx`).

- **Para adicionar uma nova calculadora**: Crie um novo componente para a calculadora (ex: `NewCalculator.jsx`), adicione-o à lista em `Calculators.jsx` e, se necessário, crie um novo modal ou lógica de exibição.
- **Para alterar a lógica de uma calculadora existente**: Modifique o componente da calculadora específica (ex: `CalculatorModal.jsx`).
- **Para alterar a apresentação visual**: Ajuste o JSX e as classes Tailwind CSS dentro de `Calculators.jsx` e dos componentes de calculadora.

## O que Interfere esta Intervenção

Alterações na forma como as calculadoras são carregadas ou na estrutura de dados que elas esperam podem afetar todos os componentes de calculadora. Modificações nos componentes de UI compartilhados podem alterar a aparência desta aba.

## Ganchos de Integração

- **Conector**: Integra com `CalculatorModal.jsx` para exibir calculadoras individuais.
- **Conector**: Pode interagir com `services/api.js` se as calculadoras precisarem de dados do backend ou para salvar resultados.

## Hook de Teste

- **Jest**: Crie testes unitários para `Calculators.jsx` em `frontend/src/components/Tools/Calculators/__tests__/Calculators.test.jsx` para cobrir a renderização da lista de calculadoras e o carregamento de calculadoras individuais.
- **Cypress**: Testes de integração podem ser adicionados em `cypress/integration/calculators.spec.js` para verificar o fluxo completo de seleção e uso de uma calculadora.

## IA Prompt Sugerido

```
IA prompt: "Desenvolva um novo componente React para uma calculadora de IMC (Índice de Massa Corporal), incluindo validação de entrada e exibição de resultados. Integre-o com o componente Calculators.jsx existente e forneça exemplos de uso e documentação JSDoc." 
```
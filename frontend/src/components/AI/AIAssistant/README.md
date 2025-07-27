# Documentação da Aba de Chat (Assistente de IA)

## Estado Atual

Este componente (`AIAssistant.jsx`) fornece a funcionalidade de chat com um assistente de inteligência artificial. Ele permite que os usuários enviem mensagens e recebam respostas do modelo de IA, exibindo a conversa em tempo real. A integração com o backend é feita através de chamadas à API para o serviço de IA.

## Estado Desejado

O objetivo é que o assistente de IA seja uma ferramenta poderosa e responsiva para auxiliar os usuários com informações e análises. Deve ser capaz de lidar com diferentes tipos de consultas, manter o contexto da conversa e ser facilmente configurável para diferentes modelos de IA ou funcionalidades adicionais (ex: sumarização, análise de documentos).

## Correlações e Codependências

- **`services/api.js`**: Utilizado para fazer chamadas à API do backend para o endpoint `/ai/chat`.
- **`store/patientStore.js`**: Pode ser usado para fornecer contexto específico do paciente para as interações com a IA.
- **Backend AI Service**: O backend (`backend/src/services/ai.service.js` ou similar) é responsável por processar as requisições de chat e interagir com o modelo de IA (Ollama).
- **`Layout/RightSidebar.jsx`**: Este componente é renderizado dentro da `RightSidebar.jsx`, que gerencia a exibição das diferentes abas (chat, calculadoras, alertas, conhecimento).

## Funções Principais

- `sendMessage(e)`: Lida com o envio de mensagens do usuário para o assistente de IA, atualiza o estado da conversa e exibe a resposta da IA.
- `formatMessageTime(timestamp)`: Formata o timestamp das mensagens para exibição.
- `scrollToBottom()`: Garante que a visualização do chat esteja sempre no final da conversa.

## Como Editar esta Aba

Para editar o comportamento ou a aparência da aba de Chat, você precisará modificar o arquivo `AIAssistant.jsx`.

- **Para alterar a lógica de interação com a IA**: Modifique a função `sendMessage` e verifique as chamadas à API em `services/api.js` e a implementação do serviço de IA no backend.
- **Para alterar a apresentação visual**: Ajuste o JSX e as classes Tailwind CSS dentro do componente `AIAssistant.jsx`. Considere a criação de subcomponentes em `frontend/src/components/AI` se a complexidade aumentar.
- **Para adicionar novas funcionalidades (ex: histórico de chat, sugestões de prompt)**: Implemente a lógica correspondente dentro do componente e, se necessário, no backend.

## O que Interfere esta Intervenção

Qualquer alteração na API do serviço de IA no backend (ex: formato da requisição/resposta) exigirá uma atualização correspondente neste componente. Modificações nas classes CSS globais ou nos componentes de UI compartilhados podem afetar a aparência desta aba. Alterações na `RightSidebar.jsx` podem impactar como esta aba é montada ou exibida.

## Ganchos de Integração

- **Conector**: Integra com `services/api.js` para comunicação com o backend de IA.
- **Conector**: É um filho direto de `Layout/RightSidebar.jsx`.
- **Hook**: Utiliza `useState` para gerenciar o estado das mensagens e `useRef` para rolagem automática.

## Hook de Teste

- **Jest**: Crie testes unitários para `AIAssistant.jsx` em `frontend/src/components/AI/__tests__/AIAssistant.test.jsx` para cobrir o envio de mensagens, a atualização do estado e a renderização da conversa.
- **Cypress**: Testes de integração podem ser adicionados em `cypress/integration/ai_chat.spec.js` para verificar o fluxo completo de interação com o assistente de IA, incluindo a comunicação com o backend mockado.

## IA Prompt Sugerido

```
IA prompt: "Implemente uma funcionalidade de histórico de chat para o componente AIAssistant.jsx, permitindo que o usuário visualize conversas anteriores. Inclua a persistência do histórico (ex: localStorage) e forneça exemplos de uso e documentação JSDoc." 
```
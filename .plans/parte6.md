Fase 6 (Backend): Correção da API de Ferramentas
Problema: As rotas GET /api/calculators e GET /api/alerts retornam erro 500 Internal Server Error.
Solução:
Diagnóstico: Este é um erro no servidor. A causa provável é uma falha na consulta ao banco de dados, seja porque a tabela não existe (migração não executada) ou um erro de lógica no controlador.
Implementação: Adicionar tratamento de erro try...catch robusto nos controladores para fornecer uma resposta de erro informativa e evitar que o servidor quebre.
Arquivo: backend/src/controllers/calculator.controller.js
// Dentro do método getCalculators
async getCalculators(req, res) {
  try {
    // ... (lógica existente para buscar calculadoras)
    const calculators = await calculatorService.getCalculators(userId, filters);
    res.status(200).json(calculators);
  } catch (error) {
    console.error('Erro ao buscar calculadoras:', error);
    // Verifica se o erro é de tabela inexistente
    if (error.name === 'SequelizeDatabaseError' && error.original?.code === '42P01') {
         return res.status(500).json({ success: false, message: 'Erro de configuração: Tabela de calculadoras não encontrada.' });
    }
    res.status(500).json({ success: false, message: 'Erro interno ao buscar calculadoras.' });
  }
}
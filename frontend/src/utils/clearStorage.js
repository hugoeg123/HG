/**
 * Utilitário para limpar storage corrompido e resetar estado da aplicação
 * 
 * Conector: Usado em authStore.js e pode ser chamado via console do browser
 * 
 * IA prompt: Adicionar backup automático do storage antes de limpar
 */

/**
 * Limpa todo o localStorage relacionado à aplicação
 */
export const clearAllStorage = () => {
  try {
    // Listar todas as chaves relacionadas à aplicação
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('auth') || key.includes('health-guardian'))) {
        keysToRemove.push(key);
      }
    }
    
    // Remover as chaves identificadas
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Removido: ${key}`);
    });
    
    console.log('✅ Storage limpo com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar storage:', error);
    return false;
  }
};

/**
 * Limpa apenas o storage de autenticação
 */
export const clearAuthStorage = () => {
  try {
    localStorage.removeItem('auth-storage');
    console.log('✅ Auth storage limpo!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar auth storage:', error);
    return false;
  }
};

/**
 * Verifica se o storage de auth está corrompido
 */
export const checkAuthStorage = () => {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (!authStorage) {
      console.log('ℹ️ Nenhum auth storage encontrado');
      return { valid: true, data: null };
    }
    
    if (authStorage === '[object Object]') {
      console.warn('⚠️ Auth storage corrompido detectado: [object Object]');
      return { valid: false, data: authStorage };
    }
    
    const parsed = JSON.parse(authStorage);
    console.log('✅ Auth storage válido:', parsed);
    return { valid: true, data: parsed };
  } catch (error) {
    console.error('❌ Auth storage inválido:', error);
    return { valid: false, data: authStorage };
  }
};

/**
 * Função para ser executada no console do browser
 */
window.healthGuardianUtils = {
  clearAllStorage,
  clearAuthStorage,
  checkAuthStorage,
  fixCorruptedAuth: () => {
    const check = checkAuthStorage();
    if (!check.valid) {
      clearAuthStorage();
      console.log('🔧 Auth storage corrompido foi limpo. Recarregue a página.');
    } else {
      console.log('✅ Auth storage está OK!');
    }
  }
};

console.log('🛠️ Health Guardian Utils carregados! Use window.healthGuardianUtils no console.');
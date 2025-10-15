import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api, { rawApi } from '../services/api';
import { initSocket, disconnectSocket, reconnectSocket } from '../services/socket';
import axios from 'axios';

const DEBUG_AUTH = Boolean(import.meta.env.VITE_DEBUG_AUTH);
const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _tokenLoggedOnce: false,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        console.log('AuthStore: Iniciando login para:', email);
        
        try {
          const response = await api.post('/auth/login', { email, password });
          const { token, user } = response.data;
          
          console.log('AuthStore: Login bem-sucedido, configurando token');
          
          // Configurar o token no cabeçalho para futuras requisições
          rawApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Salvar token no localStorage padrão e no utilitário global
          localStorage.setItem('hg_token', token);
          if (window.healthGuardianUtils?.setToken) {
            window.healthGuardianUtils.setToken(token);
          }
          
          set({ token, user, isAuthenticated: true, isLoading: false });
          
          // Conectar socket após login bem-sucedido
          initSocket(token);
          
          console.log('AuthStore: Login completo, usuário autenticado');
          return response.data;
        } catch (error) {
          const errorDetails = {
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.response?.data?.message,
            requestId: error.response?.data?.requestId,
            url: error.config?.url,
            method: error.config?.method,
            email: email,
            errorCode: error.code,
            errorName: error.name,
            hasResponse: !!error.response,
            hasRequest: !!error.request
          };
          
          console.error('AuthStore: Erro detalhado no login:', errorDetails);
          
          // Determinar mensagem de erro específica baseada no tipo de erro
          let errorMessage;
          
          if (!error.response && !error.request) {
            // Erro de configuração ou código
            errorMessage = 'Erro de configuração. Tente novamente.';
            console.error('AuthStore: Erro de configuração no login:', error.message);
          } else if (!error.response && error.request) {
            // Erro de rede - servidor não respondeu
            errorMessage = 'Falha na conexão com o servidor. Verifique sua conexão de internet.';
            console.error('AuthStore: Erro de rede - servidor não respondeu');
          } else if (error.response) {
            // Servidor respondeu com erro
            switch (error.response.status) {
              case 400:
                errorMessage = error.response.data?.message || 'Dados de login inválidos';
                break;
              case 401:
                errorMessage = 'Credenciais inválidas. Verifique seu email e senha.';
                break;
              case 429:
                errorMessage = 'Muitas tentativas de login. Tente novamente em alguns minutos.';
                break;
              case 500:
                errorMessage = 'Erro interno do servidor. Tente novamente em alguns instantes.';
                if (error.response.data?.requestId) {
                  console.error(`AuthStore: Erro do servidor com ID: ${error.response.data.requestId}`);
                }
                break;
              case 503:
                errorMessage = 'Servidor temporariamente indisponível. Tente novamente em alguns minutos.';
                break;
              default:
                errorMessage = error.response.data?.message || `Erro do servidor (${error.response.status})`;
            }
          } else {
            // Fallback para casos não cobertos
            errorMessage = 'Falha na autenticação. Verifique a conexão com o servidor.';
          }
          
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          
          return false;
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        console.log('AuthStore: Iniciando registro para:', userData.email);
        
        try {
          const response = await api.post('/auth/register', userData);
          const { token, user } = response.data;
          
          console.log('AuthStore: Registro bem-sucedido, configurando token');
          
          // Configurar o token no cabeçalho para futuras requisições
          rawApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Salvar token no localStorage padrão e no utilitário global
          localStorage.setItem('hg_token', token);
          if (window.healthGuardianUtils?.setToken) {
            window.healthGuardianUtils.setToken(token);
          }
          
          // Fazer login automático após registro
          set({ token, user, isAuthenticated: true, isLoading: false });
          console.log('AuthStore: Registro completo, usuário autenticado');
          return { success: true, data: response.data };
        } catch (error) {
          const errorDetails = {
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.response?.data?.message,
            url: error.config?.url,
            method: error.config?.method,
            email: userData.email,
            errorCode: error.code,
            errorName: error.name,
            hasResponse: !!error.response,
            hasRequest: !!error.request
          };
          
          console.error('AuthStore: Erro detalhado no registro:', errorDetails);
          
          // Determinar mensagem de erro específica
          let errorMessage;
          
          if (error.response?.status === 409) {
            errorMessage = 'Este email já está cadastrado. Tente fazer o login.';
            console.log('AuthStore: Email duplicado detectado');
          } else if (error.response?.status === 400) {
            errorMessage = error.response.data?.message || 'Dados de registro inválidos';
          } else if (error.response?.status === 429) {
            errorMessage = 'Muitas tentativas de registro. Tente novamente em alguns minutos.';
          } else if (!error.response && !error.request) {
            // Erro de configuração ou código
            errorMessage = 'Erro de configuração. Tente novamente.';
            console.error('AuthStore: Erro de configuração no registro:', error.message);
          } else if (!error.response && error.request) {
            // Erro de rede - servidor não respondeu
            errorMessage = 'Falha na conexão com o servidor. Verifique sua conexão de internet.';
            console.error('AuthStore: Erro de rede no registro - servidor não respondeu');
          } else {
            errorMessage = error.response?.data?.message || 'Falha no registro';
          }
          
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          
          return { 
            success: false, 
            error: errorMessage,
            status: error.response?.status,
            isDuplicateEmail: error.response?.status === 409
          };
        }
      },

      logout: () => {
        disconnectSocket(); // Desconecta o socket ao fazer logout
        // Remover o token do cabeçalho
        delete rawApi.defaults.headers.common['Authorization'];
        
        // Limpar tokens do localStorage
        localStorage.removeItem('hg_token');
        if (window.healthGuardianUtils?.clearToken) {
          window.healthGuardianUtils.clearToken();
        }
        
        set({ token: null, user: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        const { token, isAuthenticated } = get();
        
        // Se já está autenticado, não precisa verificar novamente
        if (isAuthenticated && token) {
          return true;
        }
        
        if (!token) {
          // Log único para token ausente
          if (!get()._tokenLoggedOnce && DEBUG_AUTH) {
            console.log('checkAuth: No token found');
            set({ _tokenLoggedOnce: true });
          }
          return false;
        }

        try {
          // Configurar o token no cabeçalho
          rawApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Verificar se o token é válido
          const response = await api.get('/auth/me');
          set({ user: response.data.user, isAuthenticated: true });
          if (DEBUG_AUTH) {
            console.log('checkAuth: Token valid, user authenticated');
          }
          return true;
        } catch (error) {
          // Se o token for inválido, fazer logout
          if (DEBUG_AUTH) {
            console.error('checkAuth: Token invalid or expired, logging out');
          }
          get().logout();
          return false;
        }
      },

      updateProfile: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.put('/auth/profile', userData);
          set({ user: response.data.user, isLoading: false });
          return true;
        } catch (error) {
          set({ 
            error: error.response?.data?.message || 'Falha ao atualizar perfil', 
            isLoading: false 
          });
          if (DEBUG_AUTH) {
            console.error('updateProfile: failed', error);
          }
          return false;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Interceptor de resposta removido para evitar duplicação
// O tratamento de erros 401 está centralizado em services/api.js

export { useAuthStore };
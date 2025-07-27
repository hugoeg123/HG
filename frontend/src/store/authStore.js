import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../services/api';
import { initSocket, disconnectSocket, reconnectSocket } from '../services/socket';
import axios from 'axios';

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { token, user } = response.data;
          
          // Configurar o token no cabeçalho para futuras requisições
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Salvar token no localStorage padrão e no utilitário global
          localStorage.setItem('hg_token', token);
          if (window.healthGuardianUtils?.setToken) {
            window.healthGuardianUtils.setToken(token);
          }
          
          set({ token, user, isAuthenticated: true, isLoading: false });
          reconnectSocket(); // Reconectar socket após login
          console.log('Login successful, token:', token, 'user:', user); // Log para depuração
          return true;
        } catch (error) {
          set({ 
            error: error.response?.data?.message || 'Falha na autenticação', 
            isLoading: false 
          });
          return false;
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', userData);
          const { token, user } = response.data;
          
          // Configurar o token no cabeçalho para futuras requisições
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Salvar token no localStorage padrão e no utilitário global
          localStorage.setItem('hg_token', token);
          if (window.healthGuardianUtils?.setToken) {
            window.healthGuardianUtils.setToken(token);
          }
          
          // Fazer login automático após registro
          set({ token, user, isAuthenticated: true, isLoading: false });
          return response.data;
        } catch (error) {
          set({ 
            error: error.response?.data?.message || 'Falha no registro', 
            isLoading: false 
          });
          return false;
        }
      },

      logout: () => {
        disconnectSocket(); // Desconecta o socket ao fazer logout
        // Remover o token do cabeçalho
        delete api.defaults.headers.common['Authorization'];
        
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
          if (!get()._tokenLoggedOnce) {
            console.log('checkAuth: No token found');
            set({ _tokenLoggedOnce: true });
          }
          return false;
        }

        try {
          // Configurar o token no cabeçalho
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Verificar se o token é válido
          const response = await api.get('/auth/me');
          set({ user: response.data.user, isAuthenticated: true });
          console.log('checkAuth: Token valid, user authenticated');
          return true;
        } catch (error) {
          // Se o token for inválido, fazer logout
          console.error('checkAuth: Token invalid or expired, logging out');
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

// Configurar interceptor de resposta para tratar erros 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.log('401 detectado no interceptor, fazendo logout');
      const authStore = useAuthStore.getState();
      authStore.logout();
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { useAuthStore };
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

let socket;

let socketLoggedOnce = false;

export const initSocket = () => {
  const { token, isAuthenticated } = useAuthStore.getState();
  
  // Só conectar se estiver autenticado
  if (!token || !isAuthenticated) {
    if (!socketLoggedOnce) {
      console.log('Socket não inicializado: usuário não autenticado');
      socketLoggedOnce = true;
    }
    return null;
  }
  
  // Inicializar o socket apenas se não estiver já conectado
  if (!socket) {
    try {
      socket = io(import.meta.env.VITE_SOCKET_URL, {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        timeout: 10000,
      });

      // Eventos de conexão
      socket.on('connect', () => {
        console.log('Socket conectado!');
        socketLoggedOnce = false; // Reset para permitir logs futuros
      });

      socket.on('disconnect', (reason) => {
        console.log(`Socket desconectado: ${reason}`);
      });

      socket.on('connect_error', (error) => {
        console.warn('Erro de conexão socket (não crítico):', error.message);
      });
    } catch (error) {
      console.warn('Falha ao inicializar socket (não crítico):', error.message);
      return null;
    }
  }

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    try {
      socket.disconnect();
    } catch (error) {
      console.warn('Erro ao desconectar socket (não crítico):', error.message);
    } finally {
      socket = null;
    }
  }
};

// Função para reconectar após re-login
export const reconnectSocket = () => {
  const { token, isAuthenticated } = useAuthStore.getState();
  
  if (!token || !isAuthenticated) {
    console.warn('Tentativa de reconexão sem token válido');
    return null;
  }
  
  console.log('Reconectando socket após re-login...');
  disconnectSocket();
  return initSocket();
};

// Função para lidar com erros de autenticação
export const handleAuthError = () => {
  console.log('Erro 401: Não autorizado. Tentando reautenticar ou deslogar.');
  disconnectSocket();
  
  // Verificar se ainda há token válido para tentar reconectar
  const { token, isAuthenticated } = useAuthStore.getState();
  if (token && isAuthenticated) {
    setTimeout(() => {
      console.log('Tentando reconectar socket...');
      initSocket();
    }, 2000);
  }
};

// Funções para lidar com eventos específicos
export const subscribeToPatient = (patientId, callback) => {
  const socket = getSocket();
  if (!socket) return;

  socket.emit('join:patient', patientId);
  socket.on(`patient:${patientId}:update`, callback);

  return () => {
    socket.off(`patient:${patientId}:update`);
    socket.emit('leave:patient', patientId);
  };
};

export const subscribeToRecord = (recordId, callback) => {
  const socket = getSocket();
  if (!socket) return;

  socket.emit('join:record', recordId);
  socket.on(`record:${recordId}:update`, callback);

  return () => {
    socket.off(`record:${recordId}:update`);
    socket.emit('leave:record', recordId);
  };
};

export const emitRecordUpdate = (recordId, data) => {
  const socket = getSocket();
  if (!socket) return;

  socket.emit('record:update', { recordId, data });
};

export const subscribeToUserActivity = (recordId, callback) => {
  const socket = getSocket();
  if (!socket) return;

  socket.on(`record:${recordId}:activity`, callback);

  return () => {
    socket.off(`record:${recordId}:activity`);
  };
};

export const emitUserActivity = (recordId, activity) => {
  const socket = getSocket();
  if (!socket) return;

  socket.emit('user:activity', { recordId, activity });
};
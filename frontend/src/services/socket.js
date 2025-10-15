import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

let socket;
// Add StrictMode-safe guards and memoized token to prevent duplicate inits/reconnect loops
let initializing = false;
let reconnecting = false;
let lastAuthToken = null;

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
  
  // Idempotent guard: if already connected/connecting, return existing socket
  if (socket && (socket.connected || socket.connecting)) {
    return socket;
  }
  // Prevent duplicate initialization under React.StrictMode
  if (initializing) {
    return socket || null;
  }
  // If the same token was already used and a socket exists, reuse it
  if (lastAuthToken === token && socket) {
    return socket;
  }
  
  initializing = true;
  try {
    // Socket URL fallback: use VITE_SOCKET_URL, default to backend on 5001 if undefined
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
    // Warn once if fallback is used
    if (!import.meta.env.VITE_SOCKET_URL && !socketLoggedOnce) {
      console.warn('VITE_SOCKET_URL não definido, usando fallback http://localhost:5001');
    }
    socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      timeout: 10000,
    });
    lastAuthToken = token;

    // Eventos de conexão
    socket.on('connect', () => {
      console.log('Socket conectado!');
      socketLoggedOnce = false; // Reset para permitir logs futuros
      reconnecting = false; // reconexão concluída
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
  } finally {
    initializing = false;
  }

  return socket;
};

export const getSocket = () => {
  // Prefer returning existing socket; lazily init if absent
  if (socket) return socket;
  return initSocket();
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
  // Prevent overlapping reconnects
  if (reconnecting || initializing) {
    return socket || null;
  }
  
  console.log('Reconectando socket após re-login...');
  reconnecting = true;
  disconnectSocket();
  return initSocket();
};

// Função para lidar com erros de autenticação
export const handleAuthError = () => {
  console.log('Erro 401: Não autorizado. Tentando reautenticar ou deslogar.');
  disconnectSocket();
  
  // Verificar se ainda há token válido para tentar reconectar (apenas uma tentativa controlada)
  const { token, isAuthenticated } = useAuthStore.getState();
  if (token && isAuthenticated && !reconnecting && !initializing) {
    reconnecting = true;
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
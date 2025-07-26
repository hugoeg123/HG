/**
 * Serviço de Socket.io
 * 
 * Configura e gerencia conexões em tempo real via Socket.io
 */

const jwt = require('jsonwebtoken');

module.exports = (io) => {
  // Armazenar usuários conectados
  const connectedUsers = new Map();

  // Middleware de autenticação para Socket.io
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Token não fornecido'));
      }

      // Verificar e decodificar o token JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userEmail = decoded.email;
      
      console.log(`Usuário ${decoded.email} (ID: ${decoded.id}) autenticado no socket ${socket.id}`);
      next();
    } catch (error) {
      console.error('Erro de autenticação socket:', error.message);
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Nova conexão autenticada: ${socket.id} - Usuário: ${socket.userEmail}`);
    
    // Armazenar usuário conectado
    connectedUsers.set(socket.userId, socket.id);

    // Notificar usuário sobre conexão bem-sucedida
    socket.emit('authenticated', { 
      success: true, 
      userId: socket.userId,
      email: socket.userEmail 
    });

    // Lidar com desconexão
    socket.on('disconnect', (reason) => {
      console.log(`Conexão encerrada: ${socket.id} - Usuário: ${socket.userEmail} - Motivo: ${reason}`);
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
      }
    });

    // Exemplo de evento para notificações em tempo real
    socket.on('notification', (data) => {
      console.log('Notificação recebida:', data);
      
      // Se a notificação for para um usuário específico
      if (data.targetUserId && connectedUsers.has(data.targetUserId)) {
        const targetSocketId = connectedUsers.get(data.targetUserId);
        io.to(targetSocketId).emit('notification', data);
      } 
      // Se for uma notificação global
      else if (data.global) {
        io.emit('notification', data);
      }
    });
  });

  // Função para enviar notificação para um usuário específico
  const sendToUser = (userId, eventName, data) => {
    if (connectedUsers.has(userId)) {
      const socketId = connectedUsers.get(userId);
      io.to(socketId).emit(eventName, data);
      return true;
    }
    return false;
  };

  // Função para enviar notificação para todos os usuários
  const broadcast = (eventName, data) => {
    io.emit(eventName, data);
  };

  // Expor funções para uso em outros módulos
  return {
    sendToUser,
    broadcast,
    getConnectedUsers: () => Array.from(connectedUsers.keys())
  };
};
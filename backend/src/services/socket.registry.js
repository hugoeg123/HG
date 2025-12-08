/**
 * Registro de Serviço de Socket
 * 
 * Permite expor o socketService (sendToUser, broadcast) para controladores
 * sem acoplamento direto ao módulo de inicialização do servidor.
 * 
 * Conectores:
 * - Setado em: app.js após inicializar socket.service
 * - Usado em: controllers/agenda.controller.js para enviar notificações
 */

let socketService = null;

const setSocketService = (service) => {
  socketService = service;
};

const getSocketService = () => socketService;

module.exports = {
  setSocketService,
  getSocketService,
};
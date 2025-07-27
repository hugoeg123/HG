# Guia de Solução de Problemas - Health Guardian

## 🔐 Problemas de Autenticação

### Erro 401 (Unauthorized) ao Acessar Rotas Protegidas

**Sintomas:**
- Console mostra `GET http://localhost:5000/api/calculators 401 (Unauthorized)`
- Mensagem "401 detectado no interceptor, fazendo logout"
- JWT é gerado mas não enviado nas requisições

**Soluções:**

1. **Verificar Token no localStorage:**
   ```javascript
   // No console do navegador
   console.log('Token hg_token:', localStorage.getItem('hg_token'));
   console.log('Token utils:', window.healthGuardianUtils?.getToken());
   ```

2. **Limpar Storage Corrompido:**
   ```javascript
   // No console do navegador
   window.healthGuardianUtils?.clearToken();
   localStorage.removeItem('hg_token');
   localStorage.removeItem('auth-storage');
   ```

3. **Verificar Headers da Requisição:**
   - Abra DevTools → Network
   - Faça login e navegue para "Calculadoras"
   - Verifique se o header `Authorization: Bearer <token>` está presente

4. **Relogar na Aplicação:**
   - Faça logout completo
   - Limpe o localStorage
   - Faça login novamente

### Fluxo de Autenticação Correto

1. **Login Bem-sucedido:**
   ```
   ✅ Token salvo em localStorage.getItem('hg_token')
   ✅ Token salvo em window.healthGuardianUtils
   ✅ Header Authorization configurado no Axios
   ```

2. **Requisições Subsequentes:**
   ```
   ✅ Interceptor adiciona automaticamente: Authorization: Bearer <token>
   ✅ Backend valida token e retorna dados
   ```

3. **Token Expirado/Inválido:**
   ```
   ❌ Backend retorna 401
   ✅ Interceptor detecta 401 e faz logout automático
   ✅ Usuário é redirecionado para /login
   ```

## 🔧 Problemas de Desenvolvimento

### Servidor Backend Não Inicia

**Verificar:**
1. PostgreSQL está rodando
2. Variáveis de ambiente configuradas (`.env`)
3. Dependências instaladas (`npm install`)

### Servidor Frontend Não Carrega

**Verificar:**
1. Porta 3000 disponível
2. Variável `VITE_API_URL` configurada
3. Dependências instaladas (`npm install`)

## 🐛 Debug Útil

### Logs de Autenticação
```javascript
// Verificar estado do auth store
console.log('Auth Store:', useAuthStore.getState());

// Verificar tokens
console.log('Tokens:', {
  localStorage: localStorage.getItem('hg_token'),
  utils: window.healthGuardianUtils?.getToken(),
  zustand: JSON.parse(localStorage.getItem('auth-storage') || '{}')
});
```

### Limpar Completamente o Estado
```javascript
// Executar no console para reset completo
window.healthGuardianUtils?.clearAllStorage();
location.reload();
```

## 📞 Suporte

Se os problemas persistirem:
1. Verifique os logs do backend no terminal
2. Verifique os logs do frontend no console do navegador
3. Confirme que ambos os servidores estão rodando nas portas corretas
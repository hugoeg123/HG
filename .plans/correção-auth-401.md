# Plano de Correção - Erros 401 em /api/calculators e /api/alerts

## Diagnóstico Completo

### Problema Identificado
O token JWT atual não contém a propriedade `roles` necessária para o middleware `authorize`. O token foi gerado antes das correções implementadas.

### Análise dos Logs
```
Auth Middleware: Token decoded successfully: {
  sub: '8f764846-d5df-40ed-99f0-4e54a75c7440',
  iat: 1753643975,
  exp: 1754248775
  // ❌ Falta: role e roles
}
```

### Correções Implementadas

1. **✅ Middleware auth.js atualizado**
   - Adicionada propriedade `roles` array baseada em `role`
   - Fallback para 'medico' quando role não existe

2. **✅ Middleware authorize.js melhorado**
   - Suporte para verificação de roles em array
   - Compatibilidade com role única ou múltiplas

3. **✅ Controller auth.controller.js corrigido**
   - Token JWT agora inclui `roles: [role]`
   - Novos tokens terão estrutura completa

4. **✅ Middleware auth.middleware.js sincronizado**
   - Mesma estrutura de user object em ambos middlewares

## Passos para Resolução

### Passo 1: Gerar Novo Token (OBRIGATÓRIO)
```bash
# No frontend, fazer logout e login novamente
# Isso gerará um novo token com a estrutura correta:
{
  "sub": "user-id",
  "role": "medico",
  "roles": ["medico"],
  "iat": timestamp,
  "exp": timestamp
}
```

### Passo 2: Verificar Token no DevTools
1. Abrir DevTools → Application → Local Storage
2. Copiar o token e decodificar em jwt.io
3. Confirmar que contém `roles: ["medico"]`

### Passo 3: Testar Endpoints
- `/api/calculators` - deve funcionar (apenas auth)
- `/api/alerts` - deve funcionar (auth + authorize medico)

## Estrutura de Middlewares Corrigida

### Rotas de Calculadoras
```javascript
// calculator.routes.js
router.get('/', authenticate, calculatorController.getCalculators);
// ✅ Usa apenas authenticate (sem authorize)
```

### Rotas de Alertas
```javascript
// alert.routes.js
router.get('/', authMiddleware, authorize(['medico', 'admin']), alertController.list);
// ✅ Usa authMiddleware + authorize com roles
```

## Verificação de Funcionamento

### Logs Esperados (Sucesso)
```
Auth Middleware: Token decoded successfully: {
  sub: 'user-id',
  role: 'medico',
  roles: ['medico'],
  iat: timestamp,
  exp: timestamp
}
Auth Middleware: User attached to request: {
  sub: 'user-id',
  email: 'user@email.com',
  nome: 'User Name',
  role: 'medico',
  roles: ['medico']
}
GET /api/alerts - 200 ✅
GET /api/calculators - 200 ✅
```

## Troubleshooting

### Se ainda houver 401 após logout/login:
1. Verificar se o novo token contém roles
2. Verificar logs do backend para erros específicos
3. Testar com Postman usando o novo token

### Se 403 (Forbidden):
- Verificar se a role 'medico' está nas roles permitidas
- Confirmar que authorize está configurado corretamente

## Próximos Passos
1. **IMEDIATO**: Fazer logout e login no frontend
2. **VERIFICAR**: Testar ambas as abas (Calculadoras e Alertas)
3. **CONFIRMAR**: Não deve mais redirecionar para /login

---

**Status**: ✅ Correções implementadas - Aguardando novo token do usuário
**Prioridade**: Alta - Bloqueia funcionalidades principais
**Tempo estimado**: 2 minutos (logout + login)
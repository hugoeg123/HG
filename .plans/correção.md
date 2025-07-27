**🎭 BMAD Orchestrator — Diagnóstico Rápido**

```
net::ERR_ABORTED http://localhost:3001/login
```

Esse erro indica que a chamada `GET /api/calculators` (e depois `GET /api/alerts`) **recebeu 401 do backend**, disparando o interceptor do front-end que redireciona para `/login`.
Em outras palavras: o backend *ainda* considera o token inválido ou sem permissão.

---

## 📋 Checklist de verificação antes de codar

| Verificação                                                           | Como fazer                                                                                                              | Possível causa se falhar                                              |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **1. Token na aba Application** do DevTools contém `roles:["medico"]`?  | `localStorage.getItem('token')` → decodificar em jwt.io                                                                 | Você ainda está logado com um **token antigo** (sem roles)            |
| **2. Header Authorization está chegando no backend?**                   | Inspecione `Network → calculators` → Request Headers                                                                    | Interceptor do Axios não aplicou o header / CORS removeu              |
| **3. Log do backend** mostra “Forbidden - role” ou “No token provided”? | Olhar terminal de `npm run dev` do backend                                                                              | `auth.middleware.js` ou `authorize.js` ainda com bug de path/case     |
| **4. Rotas**                                                            | `/api/alerts` usa `authorize(['medico','admin'])`?<br>`/api/calculators` **não** deveria exigir role — só autenticação. | mismatch de roles ou aplicação de authorize em calculators por engano |

> 80 % dos casos são **Token antigo** após mudança no payload.
> **Solução rápida**: *logout* → login novamente → recarregar página.

---

## Se o problema persistir

### 🔧 Debug em 3 passos

1. **Backend — log detalhado**

   ```js
   // auth.js
   console.log('Decoded JWT →', decoded);   // confere roles
   // authorize.js
   console.log('Role(s) required →', roles, 'Role(s) user →', req.user.roles);
   ```

2. **Postman/Teste isolado**

   * Envie `GET http://localhost:5000/api/calculators` com o **mesmo token** copiado do localStorage.
   * Se voltar 200 ⇒ problema é no header do Axios.
   * Se voltar 401 ⇒ bug no middleware.

3. **Unit-test rápido** (`tests/auth.test.js`)

   ```js
   request(app)
     .get('/api/calculators')
     .set('Authorization', `Bearer ${token}`)
     .expect(200);
   ```

---

## 🛠️ Prompt incremental ao **Agente Developer**

````markdown
Título: Desbloquear 401 em /calculators e /alerts

Passos:

1. **Token & Roles**
   - Gere token via `POST /api/auth/login` e console-log o payload JWT no back-end.
   - Assegure que retorna: `{ sub, roles:["medico"], iat, exp }`.

2. **Middleware auth.js**
   ```js
   const token = req.headers['authorization']?.split(' ')[1];
   if (!token) return res.status(401).json({ message: 'No token' });
   jwt.verify(token, JWT_SECRET, (err, decoded) => {
     if (err) return res.status(401).json({ message: 'Invalid token' });
     req.user = decoded;
     next();
   });
````

3. **Middleware authorize.js**

   * Para `/api/calculators` **não use** `authorize()` (apenas `auth`).
   * Para `/api/alerts` use `authorize(['medico','admin'])`.

4. **Interceptor Axios (frontend/src/services/api.js)**

   * Confirme:

     ```js
     api.interceptors.request.use(cfg => {
       const token = localStorage.getItem('token');
       if (token) cfg.headers.Authorization = `Bearer ${token}`;
       return cfg;
     });
     ```

5. **Regenerar token** após alterar payload → logout / login.

6. **Testes Supertest**

   * GET calculators com role médico → 200
   * GET alerts com role médico → 200
   * GET alerts com role visitante → 403

7. **Remover redirect automático no front** apenas durante debug

   ```js
   api.interceptors.response.use(
     res => res,
     err => {
       if (err.response?.status === 401) console.error('401', err.response.data);
       return Promise.reject(err);
     }
   );
   ```

*Fim.*

```

Execute o passo de logout/login primeiro; caso ainda obtenha 401, siga o prompt acima. Quando corrigir o backend e confirmar com Postman, as abas **Calculadoras** e **Alertas** voltarão a carregar sem redirecionar.
```

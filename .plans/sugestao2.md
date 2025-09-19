bora deixar o tema **fácil de administrar** sem perder o seu dark esverdeado. A ideia é ter **1 contrato de tokens** (CSS vars semânticas) e **vários temas** que só “preenchem” esses tokens. Assim, você mantém o dark-teal e ganha o bright gelo-azul, sem sair caçando cor em componente.

---

# 1) Contrato único de tokens (fonte de verdade)

Crie `src/styles/themes.css` com **apenas nomes semânticos** que o Tailwind vai consumir:

```css
/* contrato base: nomes estáveis que o app usa */
:root {
  --background: 0 0% 100%;
  --foreground: 217 32% 17%;

  --card: 0 0% 100%;
  --card-foreground: var(--foreground);

  --popover: 0 0% 100%;
  --popover-foreground: var(--foreground);

  --primary: 217 91% 60%;                /* acento */
  --primary-foreground: 0 0% 100%;
  --ring: var(--primary);

  --secondary: 210 40% 96.1%;
  --secondary-foreground: 217 32% 17%;

  --accent: 210 40% 96.1%;
  --accent-foreground: 217 57% 21%;
  --muted: 210 20% 96%;
  --muted-foreground: 215 16% 46%;

  --border: 214 32% 91%;
  --input: var(--border);

  --success: 160 84% 39%;
  --warning: 38 92% 50%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 98%;
}

/* Tema 1: LIGHT ICE (gelo + azul) */
.theme-light-ice {
  /* Pode manter igual ao :root ou ajustar finos */
}

/* Tema 2: DARK TEAL (seu dark atual esverdeado) */
.theme-dark-teal {
  --background: 215 22% 13%;             /* ~slate-900/800 */
  --foreground: 210 20% 95%;

  --card: 215 22% 16%;
  --card-foreground: var(--foreground);

  --popover: 215 22% 16%;
  --popover-foreground: var(--foreground);

  --primary: 174 62% 45%;                /* teal-500 */
  --primary-foreground: 0 0% 0%;
  --ring: var(--primary);

  --secondary: 215 22% 18%;
  --secondary-foreground: var(--foreground);

  --accent: 215 19% 20%;
  --accent-foreground: var(--foreground);
  --muted: 215 19% 22%;
  --muted-foreground: 210 11% 71%;

  --border: 215 18% 27%;
  --input: var(--border);

  --success: 160 84% 39%;
  --warning: 42 96% 56%;
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 100%;
}

/* opcional: você pode manter um “escopo” para áreas específicas
.main-surface { background-color: hsl(var(--background)); } */
```

> Tudo que for cor no app passa a vir **destes nomes**.

---

# 2) Tailwind mapeado para as vars (sem HEX)

No `tailwind.config.js`, garanta o mapeamento:

```js
extend: {
  colors: {
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
    popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
    primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
    secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
    accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
    muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
    border: 'hsl(var(--border))',
    input: 'hsl(var(--input))',
    ring: 'hsl(var(--ring))',
    success: 'hsl(var(--success))',
    warning: 'hsl(var(--warning))',
    destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
  },
}
```

> Isso faz `bg-card`, `text-foreground`, `border-border`, `ring-ring`, `bg-primary` etc. obedecerem ao tema.

---

# 3) Aplicação de tema (sem quebrar o que você tem)

No `App.jsx` (ou ThemeProvider), aplique **duas classes** no `<html>`:

* uma **classe de tema** (`theme-light-ice` ou `theme-dark-teal`)
* a classe **`.dark`** *apenas* quando o tema for escuro (para utilitárias `dark:` do Tailwind)

```ts
// pseudo-código
useEffect(() => {
  const html = document.documentElement;
  html.classList.remove('theme-light-ice', 'theme-dark-teal', 'dark');

  if (theme === 'light-ice') {
    html.classList.add('theme-light-ice');         // claro
  } else if (theme === 'dark-teal') {
    html.classList.add('theme-dark-teal', 'dark');  // escuro + ativa dark:
  }
}, [theme]);
```

> Mantém seu dark esverdeado intacto e permite trocar para o bright de forma centralizada.

---

# 4) “Zona de conflito”: o que manter e o que migrar

**Mantenha (compatível):**

* Componentes que já usam **tokens semânticos**:
  `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `ring-ring`, `text-primary`, `bg-primary`, `hover:bg-accent`, etc.

**Migrar (causa inconsistência):**

* `theme-*` com HEX no `tailwind.config.js` → **troque para vars** ou remova.
* `text-white`, `text-gray-*`, `border-gray-*` → `text-foreground/muted-foreground`, `border-border`.
* `text-teal-*`, `ring-teal-*`, `border-teal-*`, `bg-teal-*` **hardcoded** → `text-primary`, `ring-ring`, `border-primary/30`, `bg-primary`.
* CSS legado: seletores `.dark-mode, :root { … }` e `body { background: var(--color-bg-dark) }` → **remover** ou refatorar para usar os **novos tokens**.

  > O `:root` escurecendo tudo é o maior vilão da inconsistência.

---

# 5) “Dupla personalidade” resolvida: shadcn + seu legado

Você tem **dois Cards** e alguns Buttons que ainda misturam tokens antigos. Padronize:

* **Card**: `rounded-xl border border-border bg-card text-card-foreground shadow`
* **Button** (variants):

  * `default`: `bg-primary text-primary-foreground hover:opacity-90 focus-visible:ring-ring`
  * `outline`: `bg-card text-foreground border border-border hover:border-primary/30 hover:bg-accent`
  * `ghost`: `bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground`

> Assim, qualquer ajuste de cor é 100% via **themes.css**.

---

# 6) Guardrails para não “vazar” verde no bright

Adicione um **eslint custom** (ou script simples) que marque classes proibidas:

* proibidos: `text-(teal|emerald|green)-\d+`, `ring-(teal|emerald|green)-\d+`, `border-(teal|emerald|green)-\d+`, `text-white`, `border-gray-\d+`, `bg-gray-\d+`
* sugeridos: `text-primary`, `ring-ring`, `border-primary/30`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-card`

*(posso te passar um script Node para varrer e listar ocorrências, se quiser).*

---

# 7) Como você mantém o **dark esverdeado** intacto

* O tema `theme-dark-teal` recebe exatamente os **HSL** que você usa hoje (teal, cinzas, etc.).
* Seus componentes passam a usar **apenas tokens semânticos**; o verde “sai” dos componentes e “entra” no arquivo de tema.
* Quando quiser “clonar” esse dark para uma variante (ex.: “dark-azul”), só cria outra classe `.theme-dark-blue` mudando `--primary` e meia dúzia de cinzas.

---

# 8) Passo-a-passo de migração (rápido e seguro)

1. **Adicionar `themes.css`** (contrato + dois temas).
2. **Conferir `tailwind.config.js`** (mapa para vars; remover `theme-*` hex).
3. **Trocar toggle** para aplicar `theme-*` + `.dark` (apenas para o tema escuro).
4. **Find & replace** dos hardcodes (lista acima).
5. **Remover CSS legado** que fixa fundo escuro no `:root`/`body`.
6. Revisar **Navbar**, **Buttons**, **Cards**, **Inputs**, **Tags** (costumam ser os que mais “vazam” cores).

Depois disso, administrar temas = **editar só `themes.css`** (ou adicionar novos blocos `.theme-…`). O dark esverdeado continua disponível como “DARK TEAL” — e o bright gelo-azul vira só um clique no toggle.

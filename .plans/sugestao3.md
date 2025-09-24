perfeito — vou te dar um **PR mínimo** já pronto para copiar/colar no HG que:

* mantém exatamente o teu layout **header + left + center + right**,
* usa **azul no bright** e **verde no dark**,
* aumenta o **contraste no bright** (fundos mais claros + bordas visíveis),
* padroniza foco/hover/ring e superfícies (`bg-card`, `border-border`, etc.),
* sem mudar nenhum fluxo de JS.

Abaixo está o patch (arquivos e trechos). Se os caminhos diferirem no teu repo, só ajusta os paths — o conteúdo é drop-in.

---

# 1) `src/styles/theme.css` (ou `src/index.css` se preferir)

Adiciona os **tokens HSL** com contraste calibrado (bright=azul, dark=verde):

```css
/* src/styles/theme.css */
:root {
  /* BRIGHT (azul) */
  --background: 220 25% 96%;   /* app bg (#eef2f7 aprox) */
  --foreground: 222 47% 12%;   /* texto (#111827 aprox) */
  --card: 0 0% 100%;           /* superfícies */
  --muted: 220 20% 93%;        /* containers sutis */
  --border: 220 18% 80%;       /* borda visível no bright */
  --ring: 221 83% 53%;         /* blue-600 */
  --primary: 221 83% 53%;      /* blue-600 */
  --primary-foreground: 0 0% 100%;
  --accent: 201 96% 32%;       /* cyan-600 p/ info */
  --destructive: 0 72% 45%;
}

.dark {
  /* DARK (verde) */
  --background: 220 20% 9%;    /* #12161c aprox */
  --foreground: 210 20% 94%;   /* texto claro */
  --card: 220 15% 13%;         /* superfícies elevadas */
  --muted: 220 15% 16%;
  --border: 220 10% 26%;       /* borda mais forte no dark */
  --ring: 161 94% 40%;         /* emerald-600 */
  --primary: 161 94% 40%;      /* emerald-600 (HG verde) */
  --primary-foreground: 220 25% 10%;
  --accent: 201 90% 46%;       /* cyan-500/600 */
  --destructive: 0 70% 54%;
}

/* util para sombra fina de separação em cards */
.card-shadow { box-shadow: 0 1px 0 hsl(var(--border)); }
```

> Mantém tua estética: **verde** em dark e **azul** em bright, só que com contraste melhor (WCAG ≥4.5:1 nos textos primários).

Inclui este arquivo no bootstrap do app (onde você importa globals):

```ts
// src/main.tsx ou src/App.tsx
import "./styles/theme.css";
```

---

# 2) `tailwind.config.ts`

Mapeia as cores para as CSS vars (se já existirem, alinhe os nomes):

```ts
// tailwind.config.ts
export default {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        muted: "hsl(var(--muted))",
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        accent: "hsl(var(--accent))",
        destructive: "hsl(var(--destructive))",
      },
      borderRadius: {
        lg: "16px",
        md: "12px",
        sm: "10px",
      },
    },
  },
  plugins: [],
};
```

---

# 3) Ajuste mínimo nos componentes (exemplos práticos)

## Header / Rails / Cards

Troque hex e classes “fixas” pelos tokens abaixo (sem mudar markup):

```tsx
<header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
  {/* ... */}
</header>

<aside className="rounded-2xl border border-border bg-card p-3 card-shadow">...</aside>
<main className="space-y-4">...</main>
<aside className="rounded-2xl border border-border bg-card p-3 card-shadow">...</aside>

<button className="bg-primary text-primary-foreground hover:opacity-95 focus:ring-2 ring-ring">
  + Novo Paciente
</button>

<input className="bg-card border border-border focus:ring-2 ring-ring ..." />
```

## Banner “Bem-vindo” (se você mantiver)

Aumenta contraste e segue tua linha azul/verde:

```tsx
<div
  className="
    rounded-2xl border border-border px-6 py-5
    bg-[linear-gradient(135deg,theme(colors.primary)_0%,theme(colors.accent)_60%,theme(colors.primary)_100%)]
    text-primary-foreground
  "
>
  {/* título + microcopy */}
</div>
```

> No dark o texto continua legível por causa de `--primary-foreground`; no bright fica azul com boa luminância.

---

# 4) “Find & Replace” rápido (seguro, sem refatorar layout)

No projeto, faça estes mapeamentos (VSCode multi-cursor resolve em minutos):

| Antes (comum)           | Depois (tokens)           |
| ----------------------- | ------------------------- |
| `bg-white`              | `bg-card`                 |
| `bg-gray-50/100`        | `bg-background`           |
| `text-gray-900`         | `text-foreground`         |
| `border-gray-200/300`   | `border-border`           |
| `ring-blue-600`         | `ring-ring`               |
| `bg-blue-600`           | `bg-primary`              |
| `text-white` (em prim.) | `text-primary-foreground` |
| `hover:bg-gray-50`      | `hover:bg-muted`          |
| `shadow-sm` p/ cards    | `card-shadow` + `border`  |

Se houver HEXs fixos (ex.: `#e5e7eb`, `#111827`, `#0ea5a5`), troque para os tokens equivalentes acima.

---

# 5) Estados e acessibilidade (só classes)

Aplique em todo clicável:

```tsx
className="focus:outline-none focus:ring-2 ring-ring"
```

Textos secundários:

```tsx
className="text-sm opacity-70"   /* se não tiver muted-foreground */
```

Alvo mínimo de toque:

```tsx
className="min-h-10 min-w-10"    /* em ícones de header, por ex. */
```

---

# 6) (Opcional) Right rail com abas **Chat | Marketplace | Alertas**

Mantém teu rail direito e fica pronto para quando o marketplace entrar:

```tsx
<div className="mb-3 flex items-center gap-2">
  <button className="rounded-full px-3 py-1 text-xs border border-border bg-muted data-[active=true]:bg-primary data-[active=true]:text-primary-foreground" data-active>
    Chat
  </button>
  <button className="rounded-full px-3 py-1 text-xs border border-border bg-muted">Marketplace</button>
  <button className="rounded-full px-3 py-1 text-xs border border-border bg-muted">Alertas</button>
</div>
```

---

## Commit message sugerido

```
feat(ui): tokens de tema (bright azul / dark verde) + contraste elevado
- adiciona CSS vars em HSL (theme.css) e mapeia no tailwind.config
- padroniza bg-card, border-border, ring-ring, primary, etc.
- melhora contraste no bright e separação de superfícies no dark
- mantém layout header + left + center + right sem alterar fluxo
```

Se quiser **exatamente os tons** do teu print do bright, posso te passar as variantes:

* `--primary`: `hsl(221 83% 53%)` (≈ `#3B82F6`/blue-600).
* Se preferir um pouco mais suave no bright: `hsl(221 83% 47%)` (blue-700).
* Gradiente do banner (bright): `from-[hsl(221 83% 60%)] via-[hsl(214 95% 68%)] to-[hsl(221 83% 53%)]`.

Se topar, eu **transformo agora** esse pacote em um patch único (com caminhos exatos que você usa: `src/styles`, `tailwind.config.ts` e o arquivo da landing) — só me diz o **path do arquivo** onde está a tua landing (ex.: `src/pages/Dashboard.tsx` ou `src/routes/(dashboard)/index.tsx`).

perfeito — vamos manter **header + left + center + right**, **verde no dark** e **azul no bright**, só que com **contraste mais “nítido” no bright** (fundos mais claros, bordas mais visíveis e azul com luminância correta). Já atualizei o mock no canvas com essa paleta (bright=azul, dark=verde) e contraste reforçado.

abaixo vai um patch enxuto para o seu repo (Tailwind + shadcn). É plug-and-play e não mexe no layout atual — só melhora contraste e consistência.

# 1) `globals.css` (ou `app/globals.css`)

Defina os tokens (bright=azul, dark=verde) com níveis de contraste mais altos:

```css
:root {
  /* BRIGHT (azul) */
  --background: 220 25% 96%;   /* app bg */
  --foreground: 222 47% 12%;   /* texto */
  --card: 0 0% 100%;
  --muted: 220 20% 93%;
  --border: 220 18% 80%;       /* borda visível no bright */
  --ring: 221 83% 53%;         /* blue-600 */
  --primary: 221 83% 53%;      /* blue-600 */
  --primary-foreground: 0 0% 100%;
  --accent: 201 96% 32%;       /* cyan-600 (info) */
  --destructive: 0 72% 45%;
}

.dark {
  /* DARK (verde) */
  --background: 220 20% 9%;
  --foreground: 210 20% 94%;
  --card: 220 15% 13%;
  --muted: 220 15% 16%;
  --border: 220 10% 26%;       /* borda mais forte no dark p/ separar */
  --ring: 161 94% 40%;         /* green-600 */
  --primary: 161 94% 40%;      /* green-600 */
  --primary-foreground: 220 25% 10%;
  --accent: 201 90% 46%;
  --destructive: 0 70% 54%;
}

/* sombra/borda consistente p/ cards */
.card-shadow { box-shadow: 0 1px 0 hsl(var(--border)); }
```

> efeito prático: no bright os cartões ficam **brancos** sobre um **cinza claro** com bordas legíveis; no dark, superfícies têm **elevação** real e o verde destaca sem “apagar”.

# 2) `tailwind.config.ts`

Garanta o mapeamento para HSL tokens (se já existir, só alinhe os nomes):

```ts
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
  borderRadius: { lg: "16px", md: "12px", sm: "10px" },
}
```

# 3) componentes (uso simples dos tokens)

* **Cards**: `className="rounded-2xl border border-border bg-card p-4 card-shadow"`
* **Inputs**: `border-border bg-card focus:ring-2 ring-ring`
* **Botões primários** (bright azul / dark verde automaticamente):
  `className="bg-primary text-primary-foreground hover:opacity-95 focus:ring-2 ring-ring"`
* **Botões “neutros”**: `border border-border bg-card hover:bg-muted`

# 4) header + sidebars (mantendo seu esquema)

Nada muda no esqueleto. Só certifique que o header e os rails usem as superfícies corretas:

```tsx
<header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
  ...
</header>

<aside className="rounded-2xl border border-border bg-card p-3 card-shadow">...</aside>
<main className="space-y-4">...</main>
<aside className="rounded-2xl border border-border bg-card p-3 card-shadow">...</aside>
```

# 5) detalhes que resolvem “sensação de baixo contraste”

* **Texto secundário**: use `text-muted-foreground` se você já tem; se não, use `opacity-70` nos subtítulos.
* **Bordas**: sempre `border-border` (o token já é mais escuro no bright e mais claro no dark).
* **Badges/Chips**: `bg-muted` + `border-border`; ativo = `bg-primary text-primary-foreground`.
* **Focus**: `focus:ring-2 ring-ring` em todos os clicáveis (teclado e acessibilidade agradecem).

---

## O que eu já fiz no mock do canvas

* Subi os tokens com **bright azul** e **dark verde** e aumentei o contraste (fundos/bordas).
* Mantive o layout **header + left + center + right**.
* Os componentes do mock já usam `bg-card`, `border-border`, `ring-ring`, etc.

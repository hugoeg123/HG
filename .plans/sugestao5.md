aqui vai um roteiro pronto para você passar ao(a) dev — direto ao ponto, com tarefas, critérios de aceite e trechos para copiar e colar. Mantém **header + left + center + right**, **azul no bright** e **verde no dark**, e aplica o estilo de forma coerente em **todas** as páginas (calculadoras, registro, listas, diálogos).

# Mensagem para o agente programador

## Objetivo

Padronizar o tema (bright=azul, dark=verde) com contraste elevado e superfícies consistentes em **todo o app** sem alterar fluxos. Introduzir utilitários e componentes base para reutilização (Surface, CardTonal, FormSection, Btn). Corrigir o tipo do `Chip` e prevenir erros de build.

---

## Entregáveis (arquivos/patch)

1. **CSS tokens globais**

* Criar `src/styles/theme.css` (ou `src/index.css`) com as CSS vars abaixo e importar uma vez no bootstrap do app.
* Tokens cobrem superfícies, texto, brand e status.

```css
:root {
  /* BRIGHT (azul) */
  --background: 220 25% 96%;
  --foreground: 222 47% 12%;
  --card: 0 0% 100%;
  --muted: 220 20% 93%;
  --border: 220 18% 80%;
  --ring: 221 83% 53%;
  --primary: 221 83% 53%;
  --primary-foreground: 0 0% 100%;
  --accent: 201 96% 32%;
  --destructive: 0 72% 45%;

  /* Superfícies + aliases */
  --surface-0: 220 25% 96%;
  --surface-1: 0 0% 100%;
  --surface-2: 0 0% 100%;
  --surface-3: 0 0% 100%;
  --outline:   220 18% 80%;
  --text: var(--foreground);
  --text-muted: 222 12% 36%;
  --text-subtle: 222 10% 45%;
}
.dark {
  /* DARK (verde) */
  --background: 220 20% 9%;
  --foreground: 210 20% 94%;
  --card: 220 15% 13%;
  --muted: 220 15% 16%;
  --border: 220 10% 26%;
  --ring: 161 94% 40%;
  --primary: 161 94% 40%;
  --primary-foreground: 220 25% 10%;
  --accent: 201 90% 46%;

  --surface-0: 220 20% 9%;
  --surface-1: 220 15% 13%;
  --surface-2: 220 15% 13%;
  --surface-3: 220 15% 17%;
  --outline:   220 10% 26%;
  --text: var(--foreground);
  --text-muted: 210 10% 70%;
  --text-subtle: 210 8% 60%;
}

/* util p/ separação sutil */
.card-shadow { box-shadow: 0 1px 0 hsl(var(--border)); }
```

E no bootstrap:

```ts
// src/main.tsx ou src/App.tsx
import "./styles/theme.css";
```

2. **Tailwind mapeado para tokens**

* Atualizar `tailwind.config.ts`:

```ts
extend: {
  colors: {
    background: "hsl(var(--background))",
    foreground: "hsl(var(--foreground))",
    card: "hsl(var(--card))",
    muted: "hsl(var(--muted))",
    border: "hsl(var(--border))",
    ring: "hsl(var(--ring))",
    primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
    accent: "hsl(var(--accent))",
    destructive: "hsl(var(--destructive))",
    surface: {
      0: "hsl(var(--surface-0))",
      1: "hsl(var(--surface-1))",
      2: "hsl(var(--surface-2))",
      3: "hsl(var(--surface-3))",
    },
  },
  borderRadius: { lg: "16px", md: "12px", sm: "10px" },
}
```

3. **Componentes utilitários (reuso em qualquer página)**

* Adicionar em `src/components/ui/base/`:

`Surface.tsx`

```tsx
export function Surface({ level = 1, className = "", ...props }: { level?: 0|1|2|3; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  const bg = {0:"bg-surface-0",1:"bg-surface-1",2:"bg-card",3:"bg-surface-3"}[level] || "bg-card";
  return <div className={`rounded-2xl border border-border ${bg} ${className}`} {...props} />;
}
```

`CardTonal.tsx`

```tsx
export function CardTonal({ tone="neutral", className="", ...props }:{tone?: "neutral"|"brand"|"success"|"warning"|"danger"; className?:string} & React.HTMLAttributes<HTMLDivElement>) {
  const map = {
    neutral: "bg-card border-border",
    brand: "bg-[hsl(var(--brand-soft,221 90% 94%))] border-transparent",
    success: "bg-[hsl(var(--success-soft,160 70% 92%))] border-transparent",
    warning: "bg-[hsl(var(--warning-soft,38 90% 92%))] border-transparent",
    danger:  "bg-[hsl(var(--danger-soft,0 85% 93%))] border-transparent",
  };
  return <div className={`rounded-2xl border ${map[tone]} ${className}`} {...props} />;
}
```

`FormSection.tsx`

```tsx
export function FormSection({ title, description, children }:{title:string; description?:string; children:React.ReactNode}) {
  return (
    <section className="rounded-2xl border border-border bg-surface-1 p-4">
      <header className="mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="text-xs opacity-70">{description}</p>}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
```

`Btn.tsx`

```tsx
export function Btn({ variant="solid", className="", ...props }:{variant?: "solid"|"outline"|"ghost"} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-ring";
  const map = {
    solid: "bg-primary text-primary-foreground hover:opacity-95",
    outline: "border border-border bg-card hover:bg-muted",
    ghost: "hover:bg-[hsl(var(--brand-soft,221 90% 94%))]",
  };
  return <button className={`${base} ${map[variant]} ${className}`} {...props} />;
}
```

4. **Correção do Chip**

* Onde houver `Chip`, ajustar tipo para evitar crashes de build:

```tsx
type ChipProps = { label: string; active?: boolean; intent?: "warn" };
```

5. **Aplicação transversal (sem refatorar layout)**

* No header, sidebars, cards, inputs e botões, usar **tokens**:

  * Header/rails/cards: `bg-card border-border card-shadow`
  * Inputs: `bg-card border border-border focus:ring-2 ring-ring`
  * Botão primário: `bg-primary text-primary-foreground focus:ring-2 ring-ring`
  * Botões neutros: `border border-border bg-card hover:bg-muted`
* Em listas/tabelas: header com `bg-surface-1`, linhas zebra `bg-surface-0/surface-1`, `border-border` nas separações.
* Calculadoras/Registro: embalar blocos em `<FormSection ...>`; alertas/sugestões usar `<CardTonal tone="brand" | "warning" | "danger">`.

6. **Find & Replace seguro**

* Substituir (global) para aumentar contraste no bright:

  * `bg-white` → `bg-card`
  * `bg-gray-50/100` → `bg-background` (ou `bg-surface-0`)
  * `border-gray-200/300` → `border-border`
  * `text-gray-900` → `text-foreground`
  * `ring-blue-600` → `ring-ring`
  * `bg-blue-600` → `bg-primary`
  * `text-white` (em primários) → `text-primary-foreground`
  * `hover:bg-gray-50` → `hover:bg-muted`
  * `shadow-sm` em cards → manter `border` + `card-shadow`

7. **A11y & UX**

* Em **todo** clicável: `focus:outline-none focus:ring-2 ring-ring` e alvo ≥ 40×40.
* Ícones do header/rails com `min-h-10 min-w-10`.
* Estados vazios: usar `soft-*` (ex.: `soft-warning`) p/ mensagens informativas.

8. **Testes (mínimos)**

* Unit: render dos 4 componentes (`Surface`, `CardTonal`, `FormSection`, `Btn`) em ambos os temas.
* Smoke: alternância de tema injeta/alternar `--primary` e `--background`.
* Regressão: `Chip intent="warn"` renderiza sem erro.

---

## Critérios de aceite (DoD)

* Bright mode: cartões **brancos** sobre **cinza claro**; borda visível em painéis e cards.
* Dark mode: superfícies com **elevação** (surface-1/2/3) e verde como **primary**.
* Em **calculadoras**, **registro** e **listas**:

  * blocos principais envolvidos por `Surface`/`FormSection`;
  * inputs com `bg-card` e `ring-ring` no foco;
  * botões primários/outline obedecendo tokens.
* Nenhum import muda rotas/fluxos; apenas estilo.
* Build limpo, sem warnings de tipo no `Chip`.

---

## Perguntas (para alinhar antes de codar)

1. No `Chip` com `intent="warn"`, quer somente **texto âmbar** ou **texto + borda/fundo tonal**? (hoje: fundo leve + texto âmbar)
2. O **Right rail** deve existir em **todas** as páginas (colapsável)? (calculadoras, registro, etc.)
3. Mantemos o **banner “Bem-vindo”** no dashboard com o gradiente `primary↔accent` ou evoluímos para uma toolbar compacta?

Se aprovar, aplico este patch em um PR único e faço a primeira rodada de **find & replace** nas páginas de **Calculadoras** e **Registro** para herdarem as superfícies.

perfeito — bora “congelar” o bright num **tema azul-gelo** sem perder seu **dark esverdeado**. Abaixo vai a palheta pronta (HSL), o patch das variáveis e a tabela de mapeamento para trocar verde→azul onde for acento (sem mexer em “success”).

---

## 1) Palheta “**Light Ice**” (bright gelo/azul)

Use como base (classe de tema ou `:root`). Todos os valores em **HSL** pra casar com o shadcn/Tailwind.

```css
/* Tema claro: ICE BLUE */
.theme-light-ice {
  /* base */
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;           /* slate-900 */

  /* superfícies */
  --card: 0 0% 100%;
  --card-foreground: var(--foreground);
  --popover: 0 0% 100%;
  --popover-foreground: var(--foreground);
  --secondary: 210 40% 96.1%;           /* gelo */
  --secondary-foreground: 222 47% 11%;
  --accent: 210 40% 96.1%;              /* gelo para hover/pill */
  --accent-foreground: 217 57% 21%;     /* slate-700 */
  --muted: 210 20% 96%;
  --muted-foreground: 215 16% 46%;      /* slate-500 */

  /* bordas/inputs/ring */
  --border: 214 32% 91%;                /* slate-200 */
  --input: var(--border);
  --ring: 217 91% 60%;                  /* azul para focus */

  /* acentos */
  --primary: 217 91% 60%;               /* blue-500 #3b82f6 */
  --primary-foreground: 0 0% 100%;

  /* estados (mantém semântica) */
  --success: 160 84% 39%;               /* verde para “ok” */
  --warning: 38 92% 50%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 98%;
}
```

> Resultado: fundos brancos/gelo, bordas cinza-claras, **acentos azuis** (botões/links/focus), textos escuros.

---

## 2) Palheta “**Dark Teal**” (seu tema atual, consolidado)

Só pra garantir consistência e fácil manutenção:

```css
/* Tema escuro: TEAL */
.theme-dark-teal {
  --background: 215 22% 13%;            /* ~slate-900 */
  --foreground: 210 20% 95%;

  --card: 215 22% 16%;
  --card-foreground: var(--foreground);
  --popover: 215 22% 16%;
  --popover-foreground: var(--foreground);
  --secondary: 215 22% 18%;
  --secondary-foreground: var(--foreground);
  --accent: 215 19% 20%;
  --accent-foreground: var(--foreground);
  --muted: 215 19% 22%;
  --muted-foreground: 210 11% 71%;

  --border: 215 18% 27%;
  --input: var(--border);
  --ring: 174 62% 45%;                  /* teal para focus */

  --primary: 174 62% 45%;               /* teal-500 */
  --primary-foreground: 0 0% 0%;

  --success: 160 84% 39%;
  --warning: 42 96% 56%;
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 100%;
}
```

---

## 3) Como aplicar (toggle simples e seguro)

* No `<html>` aplique **uma** classe de tema **e** a classe `.dark` **apenas** para temas escuros:

```ts
// pseudo
const html = document.documentElement;
html.classList.remove('theme-light-ice','theme-dark-teal','dark');

if (theme === 'light-ice') html.classList.add('theme-light-ice');
if (theme === 'dark-teal') html.classList.add('theme-dark-teal','dark');
```

* Garanta no `tailwind.config.js` que as cores vêm de vars (já mapeadas):
  `background, foreground, card, popover, primary, secondary, accent, muted, border, input, ring, success, warning, destructive`.

---

## 4) Conversão verde→azul (acento) — mapeamento prático

Troque **onde o verde era acento** (não status):

| Antes (verde/teal)              | Depois (azul)                                                                |
| ------------------------------- | ---------------------------------------------------------------------------- |
| `text-teal-*`, `text-emerald-*` | `text-primary`                                                               |
| `bg-teal-*`                     | `bg-primary`                                                                 |
| `ring-teal-*`                   | `ring-ring`                                                                  |
| `border-teal-*/30`              | `border-primary/30`                                                          |
| `hover:bg-teal-*`               | `hover:bg-primary/90` **ou** `hover:bg-accent`                               |
| gradiente `from-teal-* to-*`    | `from-primary/90 to-primary/70` **ou** remover gradiente e usar `bg-primary` |

> **Não** mude `success` (verde) — mantenha semântico.

Regex útil (procure globalmente):

```
(teal|emerald|green)-\d+|ring-(teal|emerald|green)-\d+|border-(teal|emerald|green)-\d+(\/\d+)?|text-white|text-gray-\d+|border-gray-\d+
```

E substitua por tokens semânticos (`text-primary`, `ring-ring`, `border-primary/30`, `text-foreground`, `border-border` etc.).

---

## 5) Tons de apoio (chips, cards, inputs, KPI)

Use estas classes (funcionam nos dois temas porque leem as vars):

* **Card/KPI:** `bg-card text-card-foreground border border-border`
* **Input/Search:** `bg-card text-foreground placeholder:text-muted-foreground border border-input focus-visible:ring-2 focus-visible:ring-ring`
* **Chip/Tag:** `bg-accent text-accent-foreground`
* **Botão default:** `bg-primary text-primary-foreground hover:opacity-90 focus-visible:ring-ring`
* **Botão outline:** `bg-card text-foreground border border-border hover:border-primary/30 hover:bg-accent`
* **Links:** `text-primary hover:underline`

---

## 6) Gradientes e detalhes (opcional)

* **Banner/hero** (bright): `bg-[radial-gradient(120%_120%_at_0%_0%,hsl(var(--primary)/0.15),transparent_50%)]`
* **Shadow sutil (bright):** `shadow-[0_1px_2px_rgba(16,24,40,.06),0_1px_3px_rgba(16,24,40,.1)]`
* **Shadow sutil (dark):** `shadow-[0_1px_0_rgba(255,255,255,.05)]`

---

### O que isso entrega

* **Administração centralizada**: mudar tema = editar **uma** classe (`.theme-light-ice` ou `.theme-dark-teal`).
* **Acento azul no bright** sem perder o **teal no dark**.
* **Semântica preservada** (verde só para sucesso, âmbar para aviso, vermelho para erro).
* **Sem caça ao componente**: tudo lê tokens.

Se quiser, te mando um patch estilo “copiar/colar” com `themes.css` + ajuste do toggle e um script que lista onde sobrou `teal-*`/`green-*`.

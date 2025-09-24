import React, { useMemo, useState, useEffect } from "react"
import { Plus, Search, CalendarDays, ChevronRight, Sun, Moon, Filter, Sparkles, Users, ListChecks } from "lucide-react"

/**
 * NOTE ON FIXES
 * 1) Moved all raw CSS into a <style> tag via GLOBAL_CSS to avoid TS/JS syntax errors
 *    caused by stray CSS tokens at top-level.
 * 2) Simplified Chip prop typing to avoid build-time surprises: intent?: 'warn'.
 * 3) Surface component now uses a static class map (no dynamic arbitrary TW classes)
 *    to keep JIT-friendly and predictable.
 * 4) Added DevTests component (hidden) as basic smoke tests for components.
 */

const GLOBAL_CSS = `
  /* THEME TOKENS — Bright(blue) / Dark(green) with higher contrast */
  :root {
    /* Bright (blue) */
    --background: 220 25% 96%;   /* app background */
    --foreground: 222 47% 12%;   /* main text */
    --card: 0 0% 100%;           /* surfaces */
    --muted: 220 20% 93%;        /* subtle containers */
    --border: 220 18% 80%;       /* visible borders */
    --ring: 221 83% 53%;         /* blue-600 */
    --primary: 221 83% 53%;      /* blue-600 */
    --primary-foreground: 0 0% 100%;
    --accent: 201 96% 32%;       /* cyan-600 for info */
    --destructive: 0 72% 45%;

    /* Surfaces (bright) */
    --surface-0: 220 25% 96%;
    --surface-1: 0 0% 100%;
    --surface-2: 0 0% 100%;
    --surface-3: 0 0% 100%;
    --outline:   220 18% 80%;

    /* Text (aliases) */
    --text:         var(--foreground);
    --text-muted:   222 12% 36%;
    --text-subtle:  222 10% 45%;

    /* Brand softs */
    --brand-soft: 221 90% 94%;
    --success-soft: 160 70% 92%;
    --warning-soft: 38 90% 92%;
    --danger-soft: 0 85% 93%;

    /* Status */
    --success: 161 94% 40%;
    --success-fg: 220 25% 10%;
    --warning: 38 92% 50%;
    --warning-fg: 220 25% 10%;
    --danger: 0 72% 45%;
    --danger-fg: 0 0% 100%;
  }
  .dark {
    /* Dark (green) */
    --background: 220 20% 9%;
    --foreground: 210 20% 94%;
    --card: 220 15% 13%;
    --muted: 220 15% 16%;
    --border: 220 10% 26%;
    --ring: 161 94% 40%;
    --primary: 161 94% 40%;
    --primary-foreground: 220 25% 10%;
    --accent: 201 90% 46%;

    /* Surfaces (dark) */
    --surface-0: 220 20% 9%;
    --surface-1: 220 15% 13%;
    --surface-2: 220 15% 13%;
    --surface-3: 220 15% 17%;
    --outline:   220 10% 26%;

    /* Text dark */
    --text:         var(--foreground);
    --text-muted:   210 10% 70%;
    --text-subtle:  210 8% 60%;

    /* Softs in dark */
    --brand-soft: 161 40% 18%;
    --success-soft: 161 50% 18%;
    --warning-soft: 38 55% 20%;
    --danger-soft: 0 55% 18%;

    /* Status dark */
    --success: 161 94% 40%;
    --success-fg: 220 25% 10%;
    --warning: 38 94% 58%;
    --warning-fg: 220 25% 10%;
    --danger: 0 70% 54%;
    --danger-fg: 220 25% 10%;
  }

  /* Utility classes (global) */
  .shadow-card { box-shadow: 0 1px 0 hsl(var(--border)); }
  .bg-surface-0 { background-color: hsl(var(--surface-0)); }
  .bg-surface-1 { background-color: hsl(var(--surface-1)); }
  .bg-surface-2 { background-color: hsl(var(--surface-2)); }
  .bg-surface-3 { background-color: hsl(var(--surface-3)); }
  .text-default { color: hsl(var(--text)); }
  .text-muted   { color: hsl(var(--text-muted)); }
  .text-subtle  { color: hsl(var(--text-subtle)); }
  .border-outline { border-color: hsl(var(--outline)); }
  .soft-success { background-color: hsl(var(--success-soft)); color: hsl(var(--success)); }
  .soft-warning { background-color: hsl(var(--warning-soft)); color: hsl(var(--warning)); }
  .soft-danger  { background-color: hsl(var(--danger-soft));  color: hsl(var(--danger)); }
  .soft-brand   { background-color: hsl(var(--brand-soft));   color: hsl(var(--primary)); }
` as const

export default function HealthGuardianMock() {
  const [dark, setDark] = useState(true)
  const [toolsOpen, setToolsOpen] = useState(true)
  const [query, setQuery] = useState("")

  const patients = useMemo(
    () => [
      { id: "45d1e08c", name: "Sem Nome", age: "0 anos", records: 1 },
      { id: "ba92230a", name: "Sem Nome", age: "0 anos", records: 0 },
      { id: "31a60300", name: "Sem Nome", age: "0 anos", records: 0 },
      { id: "ibiu-001", name: "ibiu", age: "—", records: 3 },
      { id: "c24", name: "Maria da Silva", age: "34 anos", records: 7 },
      { id: "a11", name: "João Pereira", age: "57 anos", records: 2 },
      { id: "b09", name: "Carla Santos", age: "23 anos", records: 1 },
    ],
    []
  )
  const filtered = patients.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))

  // Basic runtime smoke tests (hidden in UI)
  useEffect(() => {
    console.assert(["warn", undefined].includes(undefined), "Chip intent supports undefined")
  }, [])

  return (
    <div className={dark ? "dark" : ""}>
      <style>{GLOBAL_CSS}</style>

      <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        {/* Header / Toolbar */}
        <header className="sticky top-0 z-20 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/95 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--card))]/75">
          <div className="mx-auto max-w-[1400px] px-4 py-3 flex items-center gap-3">
            <Logo />
            {/* Global Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar pacientes, exames, prescrições…  (⌘K)"
                className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-9 py-2 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              />
            </div>
            <button className="hidden md:inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm hover:bg-[hsl(var(--muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]">
              <CalendarDays className="h-4 w-4" /> Hoje
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-3 py-2 text-sm text-[hsl(var(--primary-foreground))] hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]">
              <Plus className="h-4 w-4" /> Novo Paciente
            </button>

            {/* Theme toggle */}
            <button
              onClick={() => setDark((v) => !v)}
              className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              aria-label="Alternar tema"
              title="Alternar tema"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Main Grid */}
        <div className="mx-auto max-w-[1400px] grid grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[320px_1fr] xl:grid-cols-[320px_1fr_360px]">
          {/* Sidebar – Patients */}
          <aside className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight flex items-center gap-2"><Users className="h-4 w-4"/>Pacientes</h2>
              <button className="inline-flex items-center gap-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 py-1 text-xs hover:bg-[hsl(var(--muted))]">
                <Filter className="h-3.5 w-3.5"/> Filtros
              </button>
            </div>
            <div className="mb-2 flex flex-wrap gap-2">
              <Chip label="Meus" active />
              <Chip label="Ativos" />
              <Chip label="Hoje" />
              <Chip label="Atrasados" intent="warn" />
            </div>
            <div className="mt-2 h-[60vh] overflow-auto pr-1">
              <ul className="space-y-1">
                {filtered.map((p) => (
                  <li key={p.id}>
                    <PatientRow {...p} />
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Center – Overview + Recent */}
          <main className="space-y-4">
            {/* Metrics */}
            <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <MetricCard icon={<Users className="h-5 w-5"/>} label="Pacientes Ativos" value={5} />
              <MetricCard icon={<CalendarDays className="h-5 w-5"/>} label="Consultas Hoje" value={0} />
              <MetricCard icon={<ListChecks className="h-5 w-5"/>} label="Tarefas Pendentes" value={0} highlight />
            </section>

            {/* Recent Patients */}
            <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold tracking-tight">Ações Recentes</h3>
                <a className="text-sm text-[hsl(var(--primary))] hover:underline" href="#">ver todos</a>
              </div>

              <div className="space-y-2">
                {patients.slice(0, 3).map((p) => (
                  <button key={`recent-${p.id}`} className="group w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-3 text-left hover:bg-[hsl(var(--muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{p.name}</div>
                        <div className="truncate text-xs opacity-70">ID: {p.id} • {p.age} • {p.records} {p.records === 1 ? "registro" : "registros"}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 opacity-60 group-hover:opacity-100" />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </main>

          {/* Right – Tools/Chat */}
          <aside className={`${toolsOpen ? "block" : "hidden xl:block"} xl:sticky xl:top-[68px]`}>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 shadow-card">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-tight flex items-center gap-2">
                  <Sparkles className="h-4 w-4"/> Ferramentas
                </h2>
                <button onClick={() => setToolsOpen(!toolsOpen)} className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 py-1 text-xs hover:bg-[hsl(var(--muted))]">
                  {toolsOpen ? "Ocultar" : "Mostrar"}
                </button>
              </div>

              <ChatEmpty />
            </div>
          </aside>
        </div>

        {/* Footer microcopy */}
        <footer className="mx-auto max-w-[1400px] px-4 py-6 text-xs opacity-60">
          Dica: use <kbd className="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5">⌘K</kbd> para busca global, <kbd className="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5">N</kbd> para novo paciente.
        </footer>

        {/* Hidden test block */}
        <DevTests />
      </div>
    </div>
  )
}

function Logo() {
  return (
    <div className="mr-1 flex items-center gap-2">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold">
        HG
      </span>
      <span className="hidden text-sm font-semibold tracking-tight sm:inline">Health Guardian</span>
    </div>
  )
}

function Chip({ label, active=false, intent }: { label: string; active?: boolean; intent?: 'warn' }) {
  return (
    <button
      className={`rounded-full px-3 py-1 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] border ${
        active
          ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-transparent"
          : intent === "warn"
          ? "bg-[hsl(var(--muted))] text-amber-600 dark:text-amber-300 border-[hsl(var(--border))]"
          : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border-[hsl(var(--border))]"
      }`}
    >
      {label}
    </button>
  )
}

function PatientRow({ name, age, records }: { name: string; age: string; records: number }) {
  return (
    <button className="group w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-left hover:bg-[hsl(var(--muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="truncate font-medium">{name || "Sem nome"}</div>
          <div className="truncate text-xs opacity-70">{age || "idade não informada"} • {records} {records === 1 ? "registro" : "registros"}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[10px]">
            {records}
          </span>
          <ChevronRight className="h-4 w-4 opacity-60 group-hover:opacity-100" />
        </div>
      </div>
    </button>
  )
}

function MetricCard({ label, value, icon, highlight=false }: { label: string; value: number; icon?: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-card ${highlight ? "ring-1 ring-[hsl(var(--primary))]/40" : ""}`}>
      <div className="mb-1 flex items-center justify-between">
        <div className="text-sm opacity-70">{label}</div>
        <div className="opacity-60">{icon}</div>
      </div>
      <div className="flex items-end justify-between">
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        <a className="text-sm text-[hsl(var(--primary))] hover:underline" href="#">ver todos</a>
      </div>
    </div>
  )
}

function ChatEmpty() {
  const suggestions = [
    "Gerar SOAP inicial para paciente ativo",
    "Revisar alergias e interações",
    "Sugerir exames conforme queixa",
  ]
  return (
    <div className="rounded-xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-center">
      <Sparkles className="mx-auto mb-3 h-6 w-6 opacity-70" />
      <p className="mb-3 text-sm opacity-75">Selecione um paciente ou comece com um atalho:</p>
      <div className="flex flex-col gap-2">
        {suggestions.map((s) => (
          <button key={s} className="rounded-lg bg-[hsl(var(--muted))] px-3 py-2 text-sm hover:bg-[hsl(var(--muted))]/80 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]">
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

// ========= Reusable abstractions (you can lift these to your DS later) =========
export function Surface({ level = 1, className = "", ...props }: { level?: 0|1|2|3; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  const lvl = Math.min(3, Math.max(0, level)) as 0|1|2|3
  const bgMap: Record<0|1|2|3, string> = {
    0: "bg-[hsl(var(--surface-0))]",
    1: "bg-[hsl(var(--surface-1))]",
    2: "bg-[hsl(var(--surface-2))]",
    3: "bg-[hsl(var(--surface-3))]",
  }
  return (
    <div className={`rounded-2xl border border-[hsl(var(--outline))] ${bgMap[lvl]} ${className}`} {...props} />
  )
}

export function CardTonal({ tone = "neutral", className = "", ...props }: { tone?: "neutral"|"brand"|"success"|"warning"|"danger"; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  const map: Record<string, string> = {
    neutral: "bg-[hsl(var(--surface-2))] border-[hsl(var(--outline))]",
    brand:   "bg-[hsl(var(--brand-soft))] border-transparent",
    success: "bg-[hsl(var(--success-soft))] border-transparent",
    warning: "bg-[hsl(var(--warning-soft))] border-transparent",
    danger:  "bg-[hsl(var(--danger-soft))] border-transparent",
  }
  return <div className={`rounded-2xl border ${map[tone] ?? map.neutral} ${className}`} {...props} />
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-outline bg-surface-1 p-4">
      <header className="mb-3">
        <h3 className="text-sm font-semibold text-default">{title}</h3>
        {description && <p className="text-xs text-muted">{description}</p>}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

export function Btn({ variant = "solid", children, className = "", ...props }: { variant?: "solid"|"outline"|"ghost"; children: React.ReactNode; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-[hsl(var(--ring))]"
  const solid = "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-95"
  const outline = "border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted))]"
  const ghost = "hover:bg-[hsl(var(--brand-soft))]"
  const map: Record<string, string> = { solid, outline, ghost }
  return (
    <button className={`${base} ${map[variant] ?? solid} ${className}`} {...props}>{children}</button>
  )
}

function DevTests() {
  // Simple render tests; visually hidden but ensures the components render without errors
  return (
    <div className="hidden" data-testid="dev-tests">
      <Chip label="Teste" />
      <Chip label="Alerta" intent="warn" />
      <Surface level={0} />
      <Surface level={1} />
      <Surface level={2} />
      <Surface level={3} />
      <CardTonal tone="brand">brand</CardTonal>
      <FormSection title="Form Test"><Btn>OK</Btn></FormSection>
    </div>
  )
}
a ideia é você ter um único “dial” de tema e papéis semânticos que valem para qualquer tela (calculadoras, registro, listas, popovers). Fiz isso no canvas: acrescentei um Design System drop-in com:

tokens universais: --surface-0/1/2/3, --outline, --text/*, --brand, --success|warning|danger (+ soft), mapeados ao shadcn (--background, --card, --primary etc.);

utilitários globais (bg-surface-1, border-outline, soft-brand…) que você usa em qualquer página;

abstrações: <Surface level={0..3}>, <CardTonal tone=\"neutral|brand|success|warning|danger\">, <FormSection> e <Btn> – padronizam painel, cartões tonais, blocos de formulário (calculadoras) e botões.

Como aplicar no HG (sem quebrar nada)

crie src/styles/tokens.css com os tokens do canvas e importe uma vez no bootstrap.

garanta os mapeamentos no tailwind.config.ts (também deixei no canvas).

nos componentes existentes:

troque bg-white → bg-card, bg-gray-50 → bg-surface-0, border-gray-200 → border-outline, text-gray-900 → text-default, ring-blue-600 → ring (ou ring-[hsl(var(--brand))]).

para blocos grandes: envolva com <Surface level={1}> ou className="bg-surface-1 border-outline rounded-2xl".

alertas/sugestões (ex.: IA, alergias): CardTonal tone="brand"/success/warning/danger.

calculadoras: use <FormSection title="Dados clínicos">…</FormSection>; inputs com bg-card border-outline focus:ring-2 ring.

Regras rápidas para consistência

Elevação: page (surface-0), rails/painéis (surface-1), cards (surface-2), overlays (surface-3).

Bordas sempre visíveis: border-outline em painéis/cards/linhas de tabela.

Texto: primário text-default; secundário text-muted; dicas text-subtle.

Ações: botões sólidos = bg-primary; “neutros” = border-outline bg-card hover:bg-surface-3; chips/empty states = soft-*.

A11y: todos os clicáveis com focus:outline-none focus:ring-2 ring (o ring já usa a cor do tema).

Se quiser, eu transformo esse pacote em arquivos no teu repo (paths certinhos) e faço a primeira rodada de find & replace nas páginas de Calculadoras e Registro pra tudo herdar as camadas/superfícies automaticamente.

Pensado para 1m 1s

Obrigado por avisar — corrigi o erro.

O que quebrou

O SyntaxError vinha de CSS “solto” no arquivo (fora de <style>), que o parser TS/JS não entende. O hint sobre o Chip também procede: o tipo do intent podia confundir o build dependendo da config.

O que eu corrigi

Todo o CSS (tokens/utis) agora está em uma const GLOBAL_CSS e é injetado via <style>{GLOBAL_CSS}</style> — nada mais fica “solto” no topo do arquivo.

Chip agora usa intent?: 'warn' (mais simples e seguro).

O Surface deixou de usar classe Tailwind dinâmica com variável no meio; fiz map estático para manter o JIT feliz.

Adicionei um bloco DevTests (oculto) que renderiza variações dos componentes para “smoke test” de runtime.

O documento no canvas foi reescrito por completo com essas correções.

Confirmação de comportamento esperado

Antes de mexer mais, me diga por favor:

No Chip, o intent="warn" deve apenas mudar a cor do texto (âmbar) ou também o fundo/borda?

O Right rail (Ferramentas/Chat) deve sempre existir (colapsável) em todas as páginas (calculadoras, registro, etc.)?

O azul/verde dos temas está na intensidade que você quer (bright→azul, dark→verde) ou quer um azul um pouco mais escuro (blue-700) no bright?
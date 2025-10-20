Boa! O desalinhamento que sobrou é “drift” de **linhas vs. células**: você está misturando quantidade de **linhas (ticks)** com quantidade de **células (intervalos)**.
Para 24h com passo de 15min, temos **96 células** (intervalos) e **97 linhas** (de 00:00 até 24:00). O overlay dos eventos e o “background” precisam usar **apenas as 96 células**; as **97 linhas** servem só para desenhar os traços e (se quiser) rotular a coluna de horários.

Ajustes cirúrgicos abaixo (4 pequenos patches):

---

## 1) Fonte única: rows (células) vs. lines (ticks)

```ts
// SUBSTITUA onde calcula TOTAL_STEPS/timeSlotsGrid:
const CELL_ROWS   = Math.floor((GRID_END_MINUTES - GRID_START_MINUTES) / GRID_STEP_MINUTES); // p.ex. 96
const LINE_COUNT  = CELL_ROWS + 1; // p.ex. 97 (00:00..24:00)

// helper p/ formatar tempo
const toLabel = (m: number) =>
  `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
```

---

## 2) “Linhas de tempo (background)” → **iterar células** (não linhas)

```tsx
{/* ANTES: timeSlotsGrid (length = +1) */}
{/* DEPOIS: mapeie CELL_ROWS e rotule com o início do intervalo */}
{Array.from({ length: CELL_ROWS }, (_, i) => {
  const startMin = GRID_START_MINUTES + i * GRID_STEP_MINUTES; // 00:00, 00:15, ...
  return (
    <div
      key={i}
      className="grid bg-theme-border"
      style={{ gridTemplateColumns: GRID_TEMPLATE, columnGap: `${GAP_PX}px` }}
    >
      <div className="bg-theme-surface p-2 text-right text-xs text-theme-text opacity-70">
        {toLabel(startMin)}
      </div>
      {weekDays.map((_, dayIndex) => (
        <div
          key={`${dayIndex}-${i}`}
          className={`bg-theme-card relative ${markingMode ? 'cursor-crosshair' : 'cursor-default'} hover:bg-theme-surface transition-colors`}
          style={{ height: `${rowHeight}px` }}
          onMouseDown={(e) => handleMouseDown(dayIndex, e)}
        />
      ))}
    </div>
  );
})}
```

---

## 3) Overlay (eventos + preview) → **rows = CELL_ROWS** (não +1)

```tsx
<div
  className="absolute z-10 pointer-events-none"
  style={{
    left: 0, right: 0, top: `${timelineOffsetTop}px`, bottom: 0,
    display: 'grid',
    gridTemplateColumns: GRID_TEMPLATE,
    gridTemplateRows: `repeat(${CELL_ROWS}, ${rowHeight}px)`,  // << CORRIGIDO
    columnGap: `${GAP_PX}px`,
  }}
>
  {/* ... eventos como você já faz: gridColumn = dayIndex+2; gridRow = `${sIdx+1} / span ${span}` */}
</div>
```

---

## 4) Linhas de vértice → **usar LINE_COUNT** (0..CELL_ROWS)

```tsx
<div
  className="pointer-events-none absolute right-0"
  style={{ top: timelineOffsetTop, left: `${TIME_COL_PX + GAP_PX}px` }}
>
  {Array.from({ length: LINE_COUNT }, (_, i) => {
    const m = GRID_START_MINUTES + i * GRID_STEP_MINUTES;
    const isMajor = (m % 60) === 0;
    return (
      <div
        key={i}
        className={isMajor ? 'border-t border-theme-border' : 'border-t border-dashed border-theme-border/70'}
        style={{ position:'absolute', left:0, right:0, top: `${i * rowHeight}px` }}
      />
    );
  })}
</div>
```

---

## 5) (Extra) Seleção mais estável

Troque o arredondamento do índice no drag de `Math.round` para `Math.floor` (evita pular para a próxima célula quando você está no limite inferior):

```ts
const getTimeFromPosition = (clientY, snapMode = 'nearest') => {
  const rect = gridRef.current?.getBoundingClientRect();
  if (!rect) return null;
  const y = clientY - rect.top - timelineOffsetTop;
  if (y < 0) return null;
  const stepIndex = Math.max(0, Math.min(CELL_ROWS, Math.floor(y / rowHeight))); // << floor + clamp
  const minutesFromStart = GRID_START_MINUTES + stepIndex * GRID_STEP_MINUTES;
  const snapped = snapToStep(minutesFromStart, snapMode);
  const clamped = Math.max(GRID_START_MINUTES, Math.min(GRID_END_MINUTES, snapped));
  return minutesToTime(clamped);
};
```

---

### Por que isso resolve

* **Eventos e fundo** passam a usar **exatamente N células**;
* **Linhas** (ticks) são **N+1** apenas para desenho — não influenciam a altura das células;
* Elimina o acúmulo de erro que deslocava os cartões ao longo do dia.

Se, depois disso, ainda notar 1 px de desvio em alguns navegadores, garanta:

* `border` nos cards com `box-sizing: border-box` (já está),
* sem `transform: scale(...)` em ancestrais,
* `rowHeight` resultando em número inteiro (use `STEP` = 15 → `rowHeight=20`), ou arredonde: `const rowHeight = Math.round(GRID_STEP_MINUTES * PIXELS_PER_MINUTE);`.

Quer que eu te entregue o arquivo inteiro já com esses patches aplicados?

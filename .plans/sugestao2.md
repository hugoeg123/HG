A ideia está **certa** e ataca o ponto que causava o 07:00→07:15: converter o `y` diretamente para minutos e aplicar `floor/ceil` conforme início/fim. Eu incorporaria **4 ajustes** para ficar à prova de erro e 100% consistente com a grid:

---

## 1) Use o MESMO offset do overlay

O mesmo deslocamento vertical que você usa para posicionar o overlay deve ser usado para converter `clientY → y`. Centralize isso:

```ts
const getOverlayOffsetTop = () => timelineOffsetTop; // nada de nudge diferente
```

E use em TODOS os lugares (linhas, overlay e cálculo do mouse).

---

## 2) Trabalhe em **minutos** (número), não string

Deixe `getTimeFromPosition` retornar **minutos**; formate para HH:MM só na hora de exibir. Evita parse/round trip e micro-arredondamentos.

```ts
const EPS = 1e-6; // evita “ceil” indevido por flutuante

const pxToMinutes = (yPx: number) => (yPx / rowHeight) * GRID_STEP_MINUTES;

const getMinutesFromPosition = (clientY: number, snap: 'start'|'end'|'nearest') => {
  const rect = gridRef.current?.getBoundingClientRect();
  if (!rect) return null;

  const y = clientY - rect.top - getOverlayOffsetTop();
  if (y < 0) return null;

  const raw = GRID_START_MINUTES + pxToMinutes(y);

  let snapped: number;
  if (snap === 'start') {
    snapped = Math.floor((raw + EPS) / GRID_STEP_MINUTES) * GRID_STEP_MINUTES;
  } else if (snap === 'end') {
    snapped = Math.ceil((raw - EPS) / GRID_STEP_MINUTES) * GRID_STEP_MINUTES;
  } else {
    snapped = Math.round(raw / GRID_STEP_MINUTES) * GRID_STEP_MINUTES;
  }

  return Math.max(GRID_START_MINUTES, Math.min(GRID_END_MINUTES, snapped));
};
```

> O `EPS` evita o caso de o ponteiro estar exatamente na linha e um ruído flutuante levar o `ceil` a pular 1 célula.

---

## 3) Snapshot sempre em **start=floor** e **end=ceil**

Guarde **minutos** no estado de arrasto e derive **linhas** só na renderização. Isso mantém preview e “salvo” idênticos.

```ts
// state
const [drag, setDrag] = useState<null | { dayIndex: number, sMin: number, eMin: number }>(null);

// mouse down / move
const handleMouseDown = (dayIndex: number, e: React.MouseEvent) => {
  if (e.target !== e.currentTarget || !markingMode) return;
  const m = getMinutesFromPosition(e.clientY, 'start');
  if (m == null) return;
  setDrag({ dayIndex, sMin: m, eMin: m });
  setIsDragging(true);
  setIsCreatingSlot(true);
};

const handleMouseMove = (e: React.MouseEvent) => {
  if (!isDragging || !drag) return;
  const m = getMinutesFromPosition(e.clientY, 'end');
  if (m == null) return;
  setDrag(d => d ? ({ ...d, eMin: m }) : d);
};
```

Na criação/salvamento:

```ts
const handleMouseUp = async () => {
  if (!isDragging || !drag) { /* limpar */ return; }

  // normaliza com floor/ceil definitivos
  const sSnap = Math.floor(drag.sMin / GRID_STEP_MINUTES) * GRID_STEP_MINUTES;
  const eSnap = Math.ceil(drag.eMin / GRID_STEP_MINUTES) * GRID_STEP_MINUTES;
  if (eSnap <= sSnap) { /* limpar */ return; }

  const startTime = minutesToTime(sSnap);
  const endTime   = minutesToTime(eSnap);
  // ...criação/atualização como você já faz
  // limpar estado …
};
```

---

## 4) Renderize por **linhas start/end** (sem `span`)

Converta os minutos (sempre múltiplos do step) em linhas de grid e use `gridRow: start / end`. Isso elimina qualquer “meia célula” no rodapé.

```ts
const lineFromMinutes = (mins: number) => (mins - GRID_START_MINUTES) / GRID_STEP_MINUTES;

const getSlotGridLines = (slot) => {
  const sSnap = Math.floor(timeToMinutes(slot.startTime) / GRID_STEP_MINUTES) * GRID_STEP_MINUTES;
  const eSnap = Math.ceil (timeToMinutes(slot.endTime)   / GRID_STEP_MINUTES) * GRID_STEP_MINUTES;

  let sLine = lineFromMinutes(sSnap);
  let eLine = lineFromMinutes(eSnap);

  const CELL_ROWS = Math.floor((GRID_END_MINUTES - GRID_START_MINUTES) / GRID_STEP_MINUTES);
  sLine = Math.max(0, Math.min(CELL_ROWS - 1, sLine));
  eLine = Math.max(sLine + 1, Math.min(CELL_ROWS, eLine));

  return { sLine, eLine, sSnap, eSnap };
};

// no JSX:
style={{ gridColumn: dayIndex + 2, gridRow: `${pos.sLine + 1} / ${pos.eLine + 1}` }}
```

E o **preview** usa exatamente a mesma lógica:

```ts
{drag && (() => {
  const sSnap = Math.floor(drag.sMin / GRID_STEP_MINUTES) * GRID_STEP_MINUTES;
  const eSnap = Math.ceil (drag.eMin / GRID_STEP_MINUTES) * GRID_STEP_MINUTES;
  const sLine = lineFromMinutes(sSnap);
  const eLine = lineFromMinutes(eSnap);
  return (
    <div style={{
      gridColumn: drag.dayIndex + 2,
      gridRow: `${sLine + 1} / ${eLine + 1}`,
      // estilos…
    }}/>
  );
})()}
```

---

### Pequenos detalhes que evitam “drift” visual

* **rowHeight inteiro** (você já faz com `Math.round`) e **border dentro** (`box-border`), sem `margin` nos cards.
* Recalcule medidas em **resize/zoom** (você já escuta `resize`).
* Labels do bloco sempre a partir de **sSnap/eSnap** (os minutos snapados), não do payload original.

---

## Resumo

* Sua proposta de **Y→minutos** com `floor` (start) / `ceil` (end) é a base certa.
* **Incorpore**: mesmo offset, retorno em **minutos**, `EPS` anti-flutuante, e renderização por **linhas start/end** (sem `span`).
* Com isso, o bloco 07:00–08:00 fica perfeito: topo e base encaixam na grid e o texto bate 1:1 com o desenho — inclusive quando o usuário solta “no meio” da célula.

perfeito — dá pra deixar **exatamente** como a sua versão “antiga” (estética intacta), só que agora com:

* “Registrado por: **Nome (CRM 1234)**” em **todos** os cards
* **chips verdes** maiores com **abreviação da tag** (HDA, QP, EF, …)
* **coluna vertical** com os pontos da timeline

A causa do sumiço do médico/CRM e dos chips foi estrutural: o `HistoryList` hoje recebe itens vindos de `parsedRecordsByCategory.timeline`, onde você montou objetos com `allTags`, `medico`, `recordLink` etc. Mas o `RecordCard` espera `doctorName`, `doctorCRM` e `tags`. Resultado: médico e tags não aparecem. Além disso, a coluna vertical sumiu porque o `HistoryList` chama `RecordCard` puro (sem o “wrapper” com a linha e o dot).

Abaixo vai o **patch mínimo e direcionado** (num único arquivo) que corrige isso sem alterar a sua estética. Ele faz 3 coisas:

1. No `parsedRecordsByCategory`, **popular** `doctorName`, `doctorCRM`, `tags` e `createdAt` para cada item (além do que você já tinha).
2. No `HistoryList`, renderizar com o **wrapper da timeline** (linha + bolinha) *idêntico* ao antigo.
3. No `RecordCard`, aceitar `tags` **ou** `allTags` e montar o texto “Registrado por” com fallback, sem duplicar CRM.

---

### Patch (git diff) — `frontend/src/components/PatientView/PatientDashboard.jsx`

```diff
@@
-        const recordData = {
+        const tagCodes = allTags
+          .map(t => (t?.code || t?.name || '').toString().trim())
+          .filter(Boolean);
+
+        const recordData = {
           id: record.id,
           recordId: record.id,
           title: `Registro Médico - ${new Date(record.createdAt).toLocaleDateString('pt-BR')}`,
           content: record.content,
-          allTags: allTags, // Include all tags for display
+          allTags,                // mantém para compat
+          tags: tagCodes,         // 👉 compatível com RecordCard
+          doctorName: record.doctorName || null,
+          doctorCRM: record.doctorCRM || null,
+          createdAt: record.createdAt,
           data: record.createdAt ? new Date(record.createdAt).toLocaleDateString('pt-BR') : 'Data não disponível',
           hora: record.createdAt ? new Date(record.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--',
           contexto: record.context || 'Registro Médico',
           // 🔁 Padrão: Monta texto sem duplicação de CRM
            medico: record.doctorName 
              ? `${record.doctorName}${record.doctorCRM ? ` (CRM: ${record.doctorCRM})` : ''}`
              : 'Médico',
           tipo: 'Registro Médico',
           descricao: record.content.substring(0, 150) + (record.content.length > 150 ? '...' : ''),
           recordLink: `/records/${record.id}`
         };
@@
-        categorizedData.timeline.push({
+        categorizedData.timeline.push({
           id: record.id,
           recordId: record.id,
           title: 'Registro Médico',
           content: record.content,
-          allTags: [],
+          allTags: [],
+          tags: [],
+          doctorName: record.doctorName || null,
+          doctorCRM: record.doctorCRM || null,
+          createdAt: record.createdAt,
           data: record.createdAt ? new Date(record.createdAt).toLocaleDateString('pt-BR') : 'Data não disponível',
           hora: record.createdAt ? new Date(record.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--',
           contexto: record.context || 'Registro Médico',
           medico: record.doctorName 
             ? `${record.doctorName}${record.doctorCRM ? ` (CRM: ${record.doctorCRM})` : ''}`
             : 'Médico não identificado',
           tipo: 'Registro Médico',
           descricao: record.content.substring(0, 150) + (record.content.length > 150 ? '...' : ''),
           recordLink: `/records/${record.id}`
         });
@@
-const HistoryList = ({ data, patientId }) => {
-  if (!data || data.length === 0) {
-    return (
-      <Card>
-        <CardContent className="p-6 text-center text-gray-500">
-          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
-          <p>Nenhum registro histórico encontrado</p>
-        </CardContent>
-      </Card>
-    );
-  }
-  
-  return (
-    <div className="space-y-4">
-      {data.map((record) => (
-        <RecordCard key={record.id} record={record} type="historico" patientId={patientId} />
-      ))}
-    </div>
-  );
-};
+const HistoryList = ({ data, patientId }) => {
+  if (!data || data.length === 0) {
+    return (
+      <div className="p-6 text-center text-gray-500 bg-theme-card rounded-lg border border-gray-800">
+        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
+        <p>Nenhum registro histórico encontrado</p>
+      </div>
+    );
+  }
+  // 👉 Estética antiga: linha vertical e “dot”
+  return (
+    <div className="relative pl-6">
+      <span className="pointer-events-none absolute left-[10px] top-0 bottom-0 w-px bg-gray-700/80" />
+      {data.map((record, idx) => (
+        <div key={record.id || idx} className="relative mb-3 group">
+          <span className="absolute left-[6px] top-5 w-3 h-3 rounded-full bg-gray-700 border-4 border-theme-background group-hover:bg-teal-500 transition-colors" />
+          <RecordCard record={record} type="historico" patientId={patientId} />
+        </div>
+      ))}
+    </div>
+  );
+};
@@
 const RecordCard = ({ record, type, patientId }) => {
   const navigate = useNavigate();
@@
   return (
     <div 
       className="bg-theme-card p-3 sm:p-4 rounded-lg border border-gray-800 transition-all hover:border-teal-500/50 hover:bg-theme-card/80 cursor-pointer"
       onClick={handleCardClick}
       role="button"
@@
         <div className="flex-1">
           <p className="text-xs sm:text-sm text-gray-400">
-            {formatDate(record.created_at || record.createdAt)} • Registro Médico
+            {formatDate(record.created_at || record.createdAt || record.createdAt)} • Registro Médico
           </p>
@@
-          {(record.doctorName || record.doctorCRM) && (
-            <p className="text-xs text-gray-500 mt-1">
-              {(() => {
-                const name = (record.doctorName || '').toString().trim();
-                const crm = (record.doctorCRM ?? '').toString().trim();
-                if (name) return `Registrado por: ${crm ? `${name} (CRM ${crm})` : name}`;
-                return `Registrado por: ${crm ? `CRM ${crm}` : 'Médico não identificado'}`;
-              })()}
-            </p>
-          )}
+          <p className="text-xs text-gray-500 mt-1">
+            {(() => {
+              const name = (record.doctorName || '').toString().trim();
+              const crm  = (record.doctorCRM ?? '').toString().trim();
+              if (name) return `Registrado por: ${crm ? `${name} (CRM ${crm})` : name}`;
+              if (record.medico) return `Registrado por: ${record.medico}`; // compat com itens antigos
+              return `Registrado por: ${crm ? `CRM ${crm}` : 'Médico não identificado'}`;
+            })()}
+          </p>
@@
-          {record.tags && record.tags.length > 0 && (
-            <div className="flex flex-wrap gap-1 mt-2">
-              {normalizeTags(record.tags).map((tag, index) => {
-                const tagCode = formatTagForDisplay(tag, 'default').code;
-                const tagLabel = getTagLabel(tag);
-                return (
-                  <span
-                    key={`${record.id}-tag-${index}`}
-                    className={`inline-flex items-center px-2.5 py-0.5 text-[11px] sm:text-xs leading-4 font-semibold uppercase tracking-wide rounded whitespace-nowrap ${
-                      ['HDA','QP'].includes(tagCode)
-                        ? 'bg-teal-600/25 text-teal-200 border border-teal-400/50'
-                        : 'bg-teal-600/20 text-teal-300 border border-teal-500/40'
-                    }`}
-                    title={tagLabel}
-                  >
-                    {tagCode}
-                  </span>
-                );
-              })}
-            </div>
-          )}
+          {(() => {
+            // aceita tanto record.tags quanto record.allTags
+            const rawTags = Array.isArray(record.tags) && record.tags.length
+              ? record.tags
+              : (Array.isArray(record.allTags) ? record.allTags.map(t => t?.code || t?.name) : []);
+            const codes = normalizeTags(rawTags).map(t => formatTagForDisplay(t, 'default').code);
+            if (!codes.length) return null;
+            return (
+              <div className="flex flex-wrap gap-1 mt-2">
+                {codes.map((tagCode, index) => {
+                  const label = getTagLabel(tagCode);
+                  return (
+                    <span
+                      key={`${record.id}-tag-${index}`}
+                      className={`inline-flex items-center px-2.5 py-0.5 text-[11px] sm:text-xs leading-4 font-semibold uppercase tracking-wide rounded whitespace-nowrap ${
+                        ['HDA','QP'].includes(tagCode)
+                          ? 'bg-teal-600/25 text-teal-200 border border-teal-400/50'
+                          : 'bg-teal-600/20 text-teal-300 border border-teal-500/40'
+                      }`}
+                      title={label}
+                    >
+                      {tagCode}
+                    </span>
+                  );
+                })}
+              </div>
+            );
+          })()}
```

---

## Por que isso resolve (e fica igual ao seu visual antigo)

* **Médico/CRM**: o `parsedRecordsByCategory` agora **carrega** `doctorName`/`doctorCRM` em cada item que vai para a timeline. O `RecordCard` monta a frase **uma vez só** com fallback — adeus duplicação “(CRM …) (CRM: …)”.
* **Chips verdes**: o `RecordCard` aceita `tags` **ou** `allTags` e normaliza para os códigos (`HDA`, `QP`, `EF`, …), mantendo o **mesmo tom esverdeado**. Só aumentei levemente a legibilidade (`px-2.5 py-0.5`, `font-semibold`, `uppercase`).
* **Coluna vertical**: o `HistoryList` ganhou o wrapper com `pl-6`, a **linha** `absolute` à esquerda e a **bolinha** (que fica teal no hover) — exatamente como a sua referência anterior.
* **Estética geral**: não introduzi `<Card/>` do shadcn na timeline; continuo usando o **mesmo container** com `bg-theme-card p-3 sm:p-4 rounded-lg border border-gray-800` e o mesmo hover que você já tinha.

---

## Dica rápida de backend (se faltar médico/CRM)

Garanta que sua rota que abastece `currentPatient.records` traga os campos:

```js
// include: [{ model: Medico, as: 'medicoCriador', attributes: ['nome','professional_id'] }]
// e na resposta:
doctorName: row.medicoCriador?.nome || null,
doctorCRM: row.medicoCriador?.professional_id || null,
```

Com isso + o patch acima, a timeline fica **idêntica** à antiga, só que com as melhorias pedidas. Quer que eu gere um `.patch` pronto para `git apply`?

Perfeito — o problema está 100% na **forma como os itens da timeline chegam no `RecordCard`** e no **wrapper** usado para renderizar a linha/bolinha da timeline.

Abaixo vai um **patch mínimo e direto** (um único arquivo) que:

1. passa `doctorName`, `doctorCRM`, `tags` e `createdAt` para cada item (compat com seu `RecordCard`),
2. devolve o **wrapper da timeline** (coluna vertical + dot) idêntico ao antigo,
3. torna o `RecordCard` tolerante (aceita `tags` ou `allTags`) e mostra **“Registrado por: Nome (CRM 1234)” em todos os cards**,
4. exibe **chips verdes maiores** com **abreviação da tag** (HDA, QP, EF, …).

> Se seu arquivo tiver duas definições repetidas (parece que colou duas versões), mantenha **apenas uma** e aplique os hunks abaixo nela.

---

### Patch (git diff) — `frontend/src/components/PatientView/PatientDashboard.jsx`

```diff
@@
-        // Collect all tags from all sections
+        // Collect all tags from all sections
         sections.forEach(section => {
           if (section.tag) {
             allTags.push(section.tag);
           }
         });
 
-        // Determine primary category based on tags
+        // Determine primary category based on tags
         let primaryCategory = 'timeline';
         const tagCodes = allTags.map(tag => tag.code?.toUpperCase() || '').join(' ');
@@
-        const recordData = {
+        // 👉 Compat: gerar também os campos esperados pelo RecordCard
+        const recordData = {
           id: record.id,
           recordId: record.id,
           title: `Registro Médico - ${new Date(record.createdAt).toLocaleDateString('pt-BR')}`,
           content: record.content,
-          allTags: allTags, // Include all tags for display
+          allTags,                                       // mantém bruto p/ tooltip
+          tags: allTags                                   // 👉 abreviações (HDA/QP/EF…)
+            .map(t => (t?.code || t?.name || '').toString().trim())
+            .filter(Boolean),
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
```

```diff
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
+// 👉 Wrapper com COLUNA VERTICAL + DOT (estética antiga)
+const HistoryList = ({ data, patientId }) => {
+  if (!data || data.length === 0) {
+    return (
+      <div className="p-6 text-center text-gray-500 bg-theme-card rounded-lg border border-gray-800">
+        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
+        <p>Nenhum registro histórico encontrado</p>
+      </div>
+    );
+  }
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
```

```diff
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
-          <p className="text-xs sm:text-sm text-gray-400">
-            {formatDate(record.created_at || record.createdAt)} • Registro Médico
+          <p className="text-xs sm:text-sm text-gray-400">
+            {formatDate(record.created_at || record.createdAt)} • Registro Médico
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
+          {/* 👉 Sempre mostra “Registrado por”, com fallback e sem duplicar CRM */}
+          <p className="text-xs text-gray-500 mt-1">
+            {(() => {
+              const name = (record.doctorName || '').toString().trim();
+              const crm  = (record.doctorCRM ?? '').toString().trim();
+              if (name) return `Registrado por: ${crm ? `${name} (CRM ${crm})` : name}`;
+              if (record.medico) return `Registrado por: ${record.medico}`;
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
+            const raw = Array.isArray(record?.tags) && record.tags.length
+              ? record.tags
+              : (Array.isArray(record?.allTags) ? record.allTags.map(t => t?.code || t?.name) : []);
+            const codes = normalizeTags(raw).map(t => formatTagForDisplay(t, 'default').code);
+            if (!codes.length) return null;
+            return (
+              <div className="flex flex-wrap gap-1.5 mt-2">
+                {codes.map((code, i) => (
+                  <span
+                    key={`${record.id}-tag-${i}`}
+                    className={`inline-flex items-center px-3 py-1 text-[12px] sm:text-xs leading-4 font-semibold uppercase tracking-wide rounded whitespace-nowrap ${
+                      ['HDA','QP'].includes(code)
+                        ? 'bg-teal-600/25 text-teal-100 border border-teal-400/50'
+                        : 'bg-teal-600/20 text-teal-200 border border-teal-500/40'
+                    }`}
+                    title={getTagLabel(code)}
+                  >
+                    {code}
+                  </span>
+                ))}
+              </div>
+            );
+          })()}
```

---

## Observações rápidas

* **Backend/store**: este patch assume que cada `record` traz `doctorName`, `doctorCRM` e `createdAt`. Se não vierem, adicione-os onde você popula `currentPatient.records` (por ex.: `doctorName: row.medicoCriador?.nome`, `doctorCRM: row.medicoCriador?.professional_id`).
* **Sem `Card`**: o novo `HistoryList` não usa `Card` (evita quebrar a estética).
* **Chips**: agora saem sempre dos **códigos** (`HDA`, `QP`, `EF`, …), com tamanho um pouco maior e variação teal.

Isso devolve exatamente o visual “antigo” (coluna vertical e dot, chips verdes, e “Registrado por: Nome (CRM 1234)” em todos os cards), apenas corrigindo o encanamento de dados.

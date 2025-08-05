Fase 4: Corrigir a Usabilidade do Editor Segmentado
Problema: No modo de edição segmentada (HybridEditor.jsx), o campo de texto perde o foco após a digitação de cada caractere, tornando-o inutilizável.
Solução:
Diagnóstico: O componente pai (HybridEditor.jsx) está atualizando seu estado a cada caractere, o que causa uma re-renderização do componente filho (SectionBlock.jsx). Se a key do SectionBlock for instável, o React o desmonta e remonta, destruindo o foco.
Implementação: Garanta que cada SectionBlock tenha uma key estável e única. Além disso, gerencie o foco de forma explícita usando useRef para devolver o foco ao textarea correto após a re-renderização.
Arquivo: frontend/src/components/PatientView/HybridEditor.jsx
// ... (no render do HybridEditor)
{isSegmented ? (
    <div className="w-full space-y-4">
      {sections.map((section) => (
        <SectionBlock
          key={section.id} // Garanta que section.id é estável
          section={section}
          // ... outras props
        />
      ))}
    </div>
  ) : ( /* ... */ )}
  Arquivo: frontend/src/components/PatientView/SectionBlock.jsx
  const textareaRef = useRef(null);

 useEffect(() => {
   // Foca no textarea se ele deve estar ativo
   const isActive = document.activeElement === textareaRef.current;
   if (isActive) {
     textareaRef.current.focus();
   }
 }, [section.content]); // Reavalia o foco quando o conteúdo muda
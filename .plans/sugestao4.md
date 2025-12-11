Na coluna central ao iniciarmos novo registro, temos essas pre tags e estão associada a um contexto (Anamnese)
estava pensando em adicionar setas que permitissem navegar e fixar contexto tipo um carrossel pra organizar tags e selecionar tipo de registro (contexto , por exemplo triagem-tem tags pertinentes a manchester, PS, sala de emergencia , ambulatorio, uti (teremos pre tags pra cada um que a pessoa pode eliminar, voltar default  ou adicionar como ja é feito
quero que funcione em mobile e navegador, não modifique estilo estetico atual e esteja adaptado adequadamente ao modo dark e bright

quero que em uti tenha por sistema , em cada sistema tem sinal vital exame fisico e exame complementar pertinente a exemplo do modelo :

"### EVOLUÇÃO NOTURNA - UMIN ###



# Evolução: avalio paciente em leito de UTI, calmo, colaborativo. Sem queixas ativas no momento. Nega dor ou desconforto. Sem intercorrências no período.



# DISPOSITIVOS:



# NEURO: GCS 15, RASS 0, PIFR, sem sinais meníngeos, sem déficits focais, sem perda de força, sem perda de sensibilidade.

Recebe



# CARDIO: Estável hemodinamicamente, sem DVA. BRNF 2T s/s, pulsos cheios e simétricos, TEC < 3s, FC , PAM . Lactato

FC / PAM

Recebe



# RESP: MV+ s/ RA, sem desconforto respiratório em AA/IOT/TQT, FR , SatO2 . Em uso de IOT/TQT com VM no modo PSV (FiO2 / PEEP / Ps / Vc )

FR / SatO2

Recebe



# HEMATO: Sem sangramentos ativos. Em uso de profilaxia TEV com . Hb / Ht / Plaq / INR / R



# RENAL/MET: DU / BH . Dx . Cr / Ur / Na / K / Mg / P / Cl / Cai / GasoV.pH / GasoV.BIC

Recebe



# TGI: plano/globoso, flácido, RHA+, timpânico à percussão, indolor a palpação, sem massas ou VCM, DB-. Dieta , evacuação x. TGO / TGP / GGT / FA / BD / BI / BT / Amil / Lip

Recebe



# INFECTO: Táx . Leuco

Em uso de



# Conduta discutida com Dr. X:

-



X R1MI





###PROCEDIMENTOS###"

Esse modelo não é especifico do nosso app mas pode servir como alguma inspiração 
adicione tambem o XABCDE do trauma 

Adicione a possibilidadede fixar como padrão e deixe nosso de default enquanto o usuario não fixa, alem disso conecte certinho com nossas variaveis no back end 
Isso eleva a complexidade do componente de "lista simples" para uma estrutura de **Seções Agrupadas**, o que é fundamental para a UTI (sistemas) e Trauma (etapas).

Para atender ao seu pedido de manter a estética, funcionar mobile/web, ter modo dark/light e a lógica de fixar (pin), reestruturei o código.

### 1\. Estrutura de Dados (Conectada ao Back-end)

Aqui está como o JSON deve vir do seu back-end para alimentar o front. Note que quebrei o texto corrido do seu modelo de UTI em **variáveis discretas** (`keys`) para salvar no banco estruturado.

```javascript
// definitions.js (ou vindo da API)
import { Brain, Heart, Wind, Activity,  Thermometer, Droplet,  AlertTriangle,  Syringe, Stethoscope, Eye, Bone } from 'lucide-react';

export const CONTEXTS = [
  {
    id: 'uti_adulto',
    label: 'UTI / Intensiva',
    type: 'system_based', // Indica que tem sub-categorias
    sections: [
      {
        title: 'Neurológico',
        icon: Brain,
        items: [
          { key: 'neuro_gcs', label: 'Glasgow (GCS)', type: 'score' },
          { key: 'neuro_rass', label: 'RASS', type: 'score' },
          { key: 'neuro_pupilas', label: 'Pupilas / Fotomotor', type: 'select' },
          { key: 'neuro_deficit', label: 'Déficit Motor/Sensitivo', type: 'check' }
        ]
      },
      {
        title: 'Cardiovascular (Hemodinâmica)',
        icon: Heart,
        items: [
          { key: 'cardio_pa', label: 'PAM / PA Invasiva', type: 'number' },
          { key: 'cardio_fc', label: 'Frequência Cardíaca', type: 'number' },
          { key: 'cardio_dva', label: 'Drogas Vasoativas', type: 'list' }, // Noradrenalina, Vasopressina...
          { key: 'cardio_perfusao', label: 'Perfusão / TEC', type: 'text' },
          { key: 'cardio_lactato', label: 'Lactato', type: 'number' }
        ]
      },
      {
        title: 'Respiratório (Ventilação)',
        icon: Wind,
        items: [
          { key: 'resp_dispositivo', label: 'Dispositivo (TOT/TQT/VNI)', type: 'select' },
          { key: 'resp_vm_params', label: 'Parâmetros VM (FiO2/PEEP)', type: 'group' },
          { key: 'resp_gaso', label: 'Gasometria (pH/pO2/pCO2)', type: 'group' },
          { key: 'resp_ausculta', label: 'Ausculta Pulmonar', type: 'text' }
        ]
      },
      {
        title: 'Infeccioso / Metabólico',
        icon: Thermometer,
        items: [
          { key: 'inf_tax', label: 'Curva Térmica (Tax)', type: 'chart' },
          { key: 'inf_atb', label: 'Antibióticos em Uso', type: 'list' },
          { key: 'renal_bh', label: 'Balanço Hídrico (24h)', type: 'number' },
          { key: 'renal_diurese', label: 'Diurese (ml/kg/h)', type: 'number' }
        ]
      }
    ]
  },
  {
    id: 'trauma_xabcde',
    label: 'Trauma (XABCDE)',
    type: 'protocol_based',
    sections: [
      {
        title: 'X - Hemorragia Exsanguinante',
        icon: Droplet,
        color: 'text-red-600',
        items: [
          { key: 'trauma_x_contencao', label: 'Contenção de Sangramento', type: 'action' },
          { key: 'trauma_x_torniquete', label: 'Torniquete Aplicado', type: 'check' }
        ]
      },
      {
        title: 'A - Vias Aéreas',
        icon: Wind,
        items: [
          { key: 'trauma_a_perviedade', label: 'Perviedade / Colar Cervical', type: 'check' },
          { key: 'trauma_a_iot', label: 'Via Aérea Definitiva', type: 'action' }
        ]
      },
      {
        title: 'B - Respiração',
        icon: Activity,
        items: [
          { key: 'trauma_b_murmurio', label: 'Murmúrio / Expansibilidade', type: 'text' },
          { key: 'trauma_b_sato2', label: 'Saturação O2', type: 'number' }
        ]
      },
      {
        title: 'C - Circulação',
        icon: Heart,
        items: [
          { key: 'trauma_c_pulsos', label: 'Pulsos / Perfusão', type: 'text' },
          { key: 'trauma_c_fast', label: 'E-FAST / POCUS', type: 'exam' },
          { key: 'trauma_c_reposicao', label: 'Reposição Volêmica', type: 'action' }
        ]
      },
      {
        title: 'D - Neurológico',
        icon: Eye,
        items: [
          { key: 'trauma_d_glasgow', label: 'Glasgow (Atualizado)', type: 'score' },
          { key: 'trauma_d_pupilas', label: 'Pupilas', type: 'select' }
        ]
      },
      {
        title: 'E - Exposição',
        icon: Bone,
        items: [
          { key: 'trauma_e_lesoes', label: 'Inspeção Dorsal / Lesões', type: 'text' },
          { key: 'trauma_e_hipotermia', label: 'Prevenção Hipotermia', type: 'check' }
        ]
      }
    ]
  },
  {
    id: 'anamnese_padrao',
    label: 'Anamnese / Consultório',
    type: 'flat', // Lista simples igual a imagem original
    sections: [
       // Simula uma seção única para manter compatibilidade
       {
         title: 'Geral',
         items: [
           { key: 'ana_hda', label: 'Anamnese (HDA)', type: 'text' },
           { key: 'ana_ef', label: 'Exame Físico', type: 'text' },
           { key: 'ana_hd', label: 'Hipóteses Diagnósticas', type: 'list' },
           { key: 'ana_cd', label: 'Conduta / Plano', type: 'text' }
         ]
       }
    ]
  }
];
```

### 2\. O Componente React (Carrossel Inteligente)

Este código implementa a lógica de fixar (salvando no LocalStorage para persistir entre sessões) e renderiza as seções dinamicamente.

```jsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Pin, ChevronDown, ChevronUp } from 'lucide-react';
import { CONTEXTS } from './definitions'; // Importa o arquivo acima

export default function MedicalContextCarousel() {
  // Lógica de Estado
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pinnedContextId, setPinnedContextId] = useState(null);
  const [expandedSections, setExpandedSections] = useState({}); // Para fechar/abrir sistemas na UTI

  // Carregar preferência salva ao iniciar
  useEffect(() => {
    const savedPin = localStorage.getItem('hg_pinned_context');
    if (savedPin) {
      setPinnedContextId(savedPin);
      const foundIndex = CONTEXTS.findIndex(c => c.id === savedPin);
      if (foundIndex !== -1) setCurrentIndex(foundIndex);
    }
  }, []);

  const currentContext = CONTEXTS[currentIndex];
  const isPinned = pinnedContextId === currentContext.id;

  // Navegação
  const handlePrev = () => setCurrentIndex((prev) => (prev === 0 ? CONTEXTS.length - 1 : prev - 1));
  const handleNext = () => setCurrentIndex((prev) => (prev === CONTEXTS.length - 1 ? 0 : prev + 1));

  // Lógica de Fixar
  const handlePin = () => {
    if (isPinned) {
      setPinnedContextId(null);
      localStorage.removeItem('hg_pinned_context');
    } else {
      setPinnedContextId(currentContext.id);
      localStorage.setItem('hg_pinned_context', currentContext.id);
    }
  };

  // Toggle de Seções (Ex: Abrir/Fechar "Neuro")
  const toggleSection = (sectionIndex) => {
    setExpandedSections(prev => ({
      ...prev,
      [`${currentContext.id}-${sectionIndex}`]: !prev[`${currentContext.id}-${sectionIndex}`]
    }));
  };

  return (
    // Wrapper Responsivo: Adapta cores para Dark (padrão) e Light mode
    <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300">
      
      {/* --- HEADER NAVEGÁVEL --- */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 relative">
        <div className="flex items-center justify-between">
          
          <button onClick={handlePrev} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors touch-manipulation">
            <ChevronLeft size={24} />
          </button>

          <div className="flex flex-col items-center">
            {/* Indicador de Pin */}
            <button 
              onClick={handlePin}
              className={`flex items-center gap-2 text-xs uppercase tracking-wider mb-1 font-bold transition-all ${isPinned ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              title={isPinned ? "Desafixar contexto padrão" : "Fixar como padrão"}
            >
              <Pin size={12} fill={isPinned ? "currentColor" : "none"} />
              {isPinned ? "Contexto Padrão" : "Definir Padrão"}
            </button>
            
            <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 text-center animate-fade-in">
              {currentContext.label}
            </h1>
          </div>

          <button onClick={handleNext} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors touch-manipulation">
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Paginação visual (Dots) */}
        <div className="flex justify-center gap-1 mt-2">
          {CONTEXTS.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-4 bg-cyan-500' : 'w-1 bg-gray-300 dark:bg-gray-600'}`}
            />
          ))}
        </div>
      </div>

      {/* --- CORPO DINÂMICO --- */}
      <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
        
        <button className="w-full mb-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 touch-manipulation">
          <Plus size={20} />
          <span>Nova Tag em {currentContext.label.split('/')[0]}</span>
        </button>

        <div className="space-y-4">
          {currentContext.sections.map((section, idx) => {
            // Verifica se a seção está expandida (Default: Aberta na UTI, pode ser mudado)
            // Lógica: Se não estiver no state, considera TRUE (aberto por padrão)
            const sectionKey = `${currentContext.id}-${idx}`;
            const isOpen = expandedSections[sectionKey] !== false; 
            
            return (
              <div key={idx} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                
                {/* Cabeçalho da Seção (Ex: NEUROLOGICO) */}
                {currentContext.type !== 'flat' && (
                  <div 
                    onClick={() => toggleSection(idx)}
                    className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {section.icon && <section.icon size={18} className="text-cyan-600 dark:text-cyan-400" />}
                      <span className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase">
                        {section.title}
                      </span>
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-gray-500"/> : <ChevronDown size={16} className="text-gray-500"/>}
                  </div>
                )}

                {/* Lista de Itens da Seção */}
                {isOpen && (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {section.items.map((item) => (
                      <div 
                        key={item.key}
                        className="p-3 pl-4 hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer flex items-center justify-between group transition-colors"
                        onClick={() => console.log(`Abrir input para: ${item.key}`)} // Conexão com sua lógica de abrir input
                      >
                        <div className="flex flex-col">
                          <span className="text-gray-700 dark:text-gray-200 font-medium text-sm">
                            {item.label}
                          </span>
                          {/* Pequeno hint do tipo de dado (opcional) */}
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                            {item.type === 'list' ? 'Múltipla Escolha' : item.type === 'score' ? 'Calculadora' : item.type}
                          </span>
                        </div>
                        <ChevronRight size={16} className="text-gray-400 group-hover:text-cyan-500 transition-colors" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

### Explicação das Funcionalidades Adicionadas

1.  **Adaptação UTI e Trauma (Sistema por Sistema):**

      * Em vez de apenas listar tags soltas, o componente agora renderiza **Seções Colapsáveis**.
      * Na UTI, você terá o bloco `NEUROLÓGICO` contendo GCS e RASS, separado do bloco `CARDIOVASCULAR`. Isso organiza visualmente a complexidade do modelo de evolução que você enviou.
      * No Trauma, implementei o XABCDE exatamente como solicitado, usando ícones pertinentes (Gota de sangue para 'X', Pulmão para 'B', etc.).

2.  **Modo Dark e Bright:**

      * Utilizei as classes do Tailwind `dark:` em todos os pontos.
      * **Bright:** Fundo branco/cinza claro, textos escuros (`text-gray-800`), bordas suaves.
      * **Dark:** Fundo `gray-900`, textos claros, mantendo a identidade da sua imagem original.

3.  **Lógica de "Fixar Padrão" (Default):**

      * O botão de **Pin** (Alfinete) no topo salva o ID do contexto no `localStorage`.
      * Toda vez que o usuário abrir o app (reload), o `useEffect` verifica se existe um "pinnedContext" e carrega ele automaticamente. Se não, carrega o primeiro da lista.

4.  **Conexão com Back-End:**

      * Note a propriedade `key` dentro de `items` (ex: `neuro_gcs`, `cardio_pam`).
      * Quando o usuário clica para adicionar o valor, você deve usar essa `key` para saber onde salvar no seu banco de dados. Isso permite que você gere o texto da evolução automaticamente depois, concatenando os valores dessas keys.
Analise a fundo o codigo atual para planejar e intervir cirurgicamente 

Não edite o modo anamnese default -pode replicar ele em Ps (pronto socorro) ,teleconsulta e ambulatorio
 planeje para que eu selecione o -contexto e/ou possa digitar ( é uma triagem? é tele consulta ? é pronto socorro? é ambulatroio? é enfermaria? é UTI? é emergencia? resultado de exame ? pedido e exame ? plano terapeutico (FAST HUG)?- esses são os contextos , como disse anteriormente para PS teleconsulta e ambulatorio pode usar o quadro atual de anmnese , para uti pode usar o quadro por sistema , os demais podemos ir bolando, o usuario deve poder trocar os seletores e fixar qual quiser pro contexto que quiser, mas inicialmente para ps teleconsulta enfermaria  e ambulatorio vamos experimentar como default anamnese normal, se o usuario quiser modificar fique livre pra isso ,inclusive criar as tags , por hora vamos deixar um default pra uti e pra , vamos criar um pra soap tambem 
observação 
você seleciona contexto e card de tags independentemente, e pode fixar qualquer card com qualquer contexto , inclusive criar card proprio
Não altere estetica atual do card anamnese , faça a seleção de contexto ser facil e versatil
a troca de cards  ser possivel independente do contexto 
se a pessoa não definir contexto deixa como registro, e em retrospecto eventualmente terntaremos definir(vendo contexto)
seja facil fixar contexto ou fixar template de tag seja facil de escolher entre as possibilidades e criar nova
planeje muito bem cada detalhe, conheça muito bem codigo e sistema de tag atual
Aqui está uma análise técnica da sua solicitação, seguida do **Prompt Refinado**. Este prompt foi estruturado como uma "Especificação Técnica de Engenharia de Frontend", ideal para garantir que o código gerado seja robusto, escalável e atenda exatamente aos requisitos de UX e arquitetura de dados que você desenhou.

---

### 1. Análise e Planejamento Cirúrgico

O código atual (do chat anterior) comete o erro de acoplar **Contexto** (Onde estou/O que é o evento) com **Template** (Qual a estrutura das tags).
Para atender sua nova demanda, precisamos refatorar para uma arquitetura de **Matriz N:M**:

1.  **Desacoplamento de Estado:**
    * O usuário seleciona o **Contexto** (Ex: *UTI*, *PS*, *Teleconsulta*). Isso é metadado do registro.
    * O usuário seleciona o **Template de Tags** (Ex: *Anamnese Padrão*, *Por Sistemas*, *SOAP*, *XABCDE*). Isso é a UI de input.
    * **Lógica de Default:** Selecionar o Contexto "UTI" *sugere* o Template "Por Sistemas", mas o usuário pode trocar para "SOAP" se preferir, e o sistema deve lembrar dessa preferência se ele "Fixar".

2.  **Renderização Polimórfica:**
    * O componente de lista não pode ser único. Precisamos de um *Renderer* que decide:
        * É Template Simples? -> Renderiza o componente `FlatTagList` (Mantendo estética atual intacta).
        * É Template Agrupado (UTI/Trauma)? -> Renderiza o componente `SectionAccordion`.
        * É SOAP? -> Renderiza 4 blocos fixos.

3.  **Persistência Granular:**
    * O "Pin" (Fixar) deve permitir fixar o Contexto Padrão E/OU o Template Padrão.

---

### 2. O Prompt Refinado

Copie e cole o texto abaixo. Ele contém as instruções exatas, nomenclatura de variáveis e regras de negócio para gerar o código definitivo.

***

**Role:** Senior React Frontend Engineer & UX Specialist.
**Task:** Refatorar o componente de seleção de tags médicas (`MedicalContextCarousel`) para um sistema desacoplado de Contextos e Templates.

**1. Objetivos de Arquitetura:**
* **Desacoplamento:** Separe a lógica de `Context` (Cenário: UTI, PS, Teleconsulta, Enfermaria) da lógica de `Template` (Estrutura visual: Lista Simples, Sistemas, XABCDE, SOAP).
* **Relacionamento:** Cada `Context` deve ter um `defaultTemplateId`, mas o usuário pode alterar o template ativo independentemente do contexto selecionado.
* **Persistência:** O usuário pode "Fixar" (Pin) um Contexto Padrão e/ou um Template Padrão via `localStorage`.

**2. Requisitos Visuais (Estética & UX):**
* **Preservação Total (Critical):** Quando o template for "Flat" (Ex: Anamnese Padrão), a renderização deve ser **idêntica** ao design original (Lista escura, ícones simples, sem accordions).
* **Novos Layouts:**
    * **Sistemas (UTI):** Accordions agrupados por sistema (Neuro, Cardio, Resp) com inputs específicos dentro.
    * **Protocolos (XABCDE):** Seções sequenciais coloridas (Ex: X em vermelho).
    * **SOAP:** 4 Blocos grandes visíveis (Subjetivo, Objetivo, Avaliação, Plano).
* **Navegação:**
    * **Carrossel Superior:** Seleciona o **Contexto**.
    * **Seletor Secundário:** Um dropdown ou switch discreto logo abaixo do título para trocar o **Template** atual (Ex: "Usando modelo: *Sistemas* [Trocar]").
* **Responsividade:** Funcional 100% em mobile e desktop.
* **Tema:** Suporte nativo a Dark Mode (default) e Light Mode via Tailwind (`dark:` classes).

**3. Definição de Dados (Data Structure):**
Crie um arquivo de definições robusto com:
* `CONTEXTS`: Lista de cenários (Triagem, PS, Sala de Emergência, Ambulatório, UTI, Enfermaria, Teleconsulta, Exame).
    * *Nota:* PS, Teleconsulta e Ambulatório devem usar o template `anamnese_padrao` por default.
    * *Nota:* UTI deve usar o template `systems_review` por default.
    * *Nota:* Emergência deve usar o template `trauma_xabcde` por default.
* `TEMPLATES`:
    * `anamnese_padrao` (Estrutura atual: Anamnese, Exame Físico, etc).
    * `systems_review` (O modelo detalhado de UTI enviado anteriormente: Neuro, Cardio, Resp, etc).
    * `soap` (S, O, A, P).
    * `fast_hug` (Feeding, Analgesia, Sedation, etc - para contexto de Plano Terapêutico).

**4. Regras de Backend/Integração:**
* Cada item (tag/input) deve possuir uma `key` única (ex: `neuro_gcs`, `soap_s`) para mapeamento no banco de dados, independente de qual template foi usado para preenchê-lo.
* Se nenhum contexto for selecionado, assumir contexto genérico "Registro".

**5. Output Esperado:**
* Código React completo usando Hooks (`useState`, `useEffect`).
* Uso de `lucide-react` para ícones.
* Tailwind CSS para estilização.
* Não remova nenhuma funcionalidade existente de "Criar Nova Tag" ou "Navegar".

**Contexto do Usuário:** O usuário é médico e desenvolvedor. O código deve ser "cirúrgico", limpo e pronto para produção no projeto `Health Guardian`.
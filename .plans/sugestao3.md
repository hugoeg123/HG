- Atualizar avisos e destaque no editor para Temp, SpO2, FC, FR e PAS com limites rigorosos e fontes clínicas.
- Unificar a lógica de alerta para quem registra (profissional no editor) e para registro pelo paciente (cartão de vitais) usando o mesmo motor.
- Incorporar exceção para DPOC em SpO2 e restringir regra de FC a adulto não gestante.
- Corrigir os “3 logs”: erro de require no hook de eventos, garantir destaque/alerta nas novas variáveis, e evitar loading preso no dashboard.
Correções de Logs

- Corrigido “ReferenceError: require is not defined” no hook de eventos alterando para import ESM.
  - Referência: frontend/src/lib/events.js:1-2,69-76
- Evitado “loading contínuo” no dashboard após abort:
  - Referência: frontend/src/store/patientStore.js:586-589
- Editor agora reconhece e colore também Temp e SpO2 (regex com décimos).
  - Referência: frontend/src/components/PatientView/VitalSignEditor.jsx:44-55,68-79
Implementado

- Lógica de limiares de destaque (frontend simples, estilo IDE).
  - Atualizado para adulto:
    - FC: 60–100; FR: 12–20; PAS: 90–180; Temp: >37,8; SpO2: ≤92%.
    - Referência: frontend/src/utils/vitalRules.js:8-50
- VitalSignEditor: destaque em tempo real de PA , FC , FR , SpO2 , Temp .
  - Regex aceita decimais em Temp .
  - Referência: frontend/src/components/PatientView/VitalSignEditor.jsx:44-55,68-79
- Parser de texto: extração numérica para FR e SpO2 (além de Temp , PA , FC ).
  - Referência: frontend/src/shared/parser.js:116-124
- Motor de alerta unificado:
  - Adulto não gestante: avisa/destaca se FC < 60 ou FC > 100 (somente >=18 e não gestante).
  - FR : avisa quando fora de 12–20.
  - Temp : avisa se > 37,8 °C ou < 35,0 °C .
  - SpO2 :
    - Geral (ar ambiente, sem DPOC): avisa se ≤ 92% .
    - DPOC: vermelho < 88% , laranja > 96% (risco hipercapnia).
  - PAS : avisa se ≤ 90 ou ≥ 180 (hipotensão/crise).
  - Referência: frontend/src/lib/vitalSignAlerts.js:11-41,56-66,109-141,144-161
- Integração “registro do paciente”:
  - Cartão de vitais passa contexto de idade, gestação e DPOC para o motor de alertas.
  - Referência: frontend/src/components/PatientProfile/VitalSignsCard.jsx:21-26,38-63,64-73
- Integração “registro do profissional”:
  - Editor híbrido extrai vitais ( PA/FC/FR/SpO2/Temp ) e emite alerta local em tempo real (barra de alertas) com o novo contexto (idade, gestante, DPOC).
  - Referência: frontend/src/components/PatientView/HybridEditor.jsx:213-259
- Barra de alertas:
  - Já recebe eventos do backend por socket e também “alertas locais” do editor; permite dispensar alertas efêmeros.
  - Referência: frontend/src/components/Tools/Alerts.jsx:79-81,137-145
Limites Solicitados

- Temperatura: destacar/avisar se > 37,8 °C .
- Saturação (SpO2): em ar ambiente e sem DPOC, avisar/destacar se ≤ 92% .
- FC: se ≥ 18 anos e não gestante, avisar/destacar quando FC < 60 ou FC > 100 .
- FR: avisar/destacar quando FR < 12 ou FR > 20 .
- PAS: avisar/destacar quando PAS ≤ 90 ou PAS ≥ 180 .
Exceção DPOC (complemento técnico)

- Alvo 88–92%; vermelho < 88% ; laranja > 96% .
- Aplicado no motor de alertas quando hasCOPD e onRoomAir = true .
- Referência: frontend/src/lib/vitalSignAlerts.js:144-161
Documentação

- Arquivo criado: docs/VITALS_ALERT_LIMITS_BY_AGE.md
  - Adulto (≥18, não gestante): faixas e cortes operacionais.
  - DPOC: exceções de SpO2 (BTS/SBPT).
  - Pediatria: tabela “verde” por idade e regra de hipotensão (PALS/AHA).
  - Integrações com componentes.
  - Fontes e links conforme sugestao4 , sugestao5 , sugestao6 .
- Referência: docs/VITALS_ALERT_LIMITS_BY_AGE.md:1-43
Como funciona na prática

- Profissional:
  - No editor, digitar “>>PA: 180/120”, “>>FC: 105”, “>>FR: 24”, “>>SpO2: 90”, “>>Temp: 38,0”:
    - Destaque visual imediato e alerta local na barra.
- Paciente:
  - No cartão de vitais, ao informar valores, os avisos aparecem de forma instantânea seguindo as mesmas regras (com idade/gestação/DPOC derivadas do perfil quando disponíveis).
Notas de rigor

- Adulto: FC 60–100, FR 12–20, PAS 90–120/60–80; alerta para hipotensão (≤90) e crise hipertensiva (≥180).
- Temperatura: corte de febre operacional > 37,8 °C , hipotermia < 35,0 °C (MedlinePlus/Mayo/Cleveland).
- SpO2: regra geral em ar ambiente e exceções DPOC conforme BTS/SBPT.
- Pediatria: faixas de normalidade e regra de hipotensão por idade (PALS/AHA).
Se quiser, sincronizo estes limites com o backend ( backend/src/utils/vitalSignParser.js ) para garantir consistência absoluta, e adiciono testes unitários de extração/alerta com casos de borda (incluindo DPOC e gestação).
porfavor, prossiga, use DPOC e gestação de forma condicional pra avaliar frente a outro limiar de criterios
Objetivo

- Tornar a avaliação e os destaques de sinais vitais condicionais a DPOC e gestação, com limiares próprios e rigor clínico.
- Integrar a mesma lógica para registro pelo paciente e pelo profissional, com alertas reativos e destaque no editor.
Regras Condicionais

- Adulto não gestante:
  - Temp : alerta quando > 37,8 °C ou < 35,0 °C
  - SpO2 em ar ambiente: alerta quando ≤ 92%
  - FC : alerta quando < 60 bpm ou > 100 bpm
  - FR : alerta quando < 12 ou > 20 irpm
  - PAS : alerta quando ≤ 90 mmHg (hipotensão) ou ≥ 180 mmHg (crise hipertensiva)
- DPOC (condição especial para SpO2, BTS/SBPT):
  - Alvo terapêutico: 88–92%
  - Alerta vermelho: < 88%
  - Alerta laranja (risco hipercapnia): > 96%
- Gestação (ajuste operacional para FC, conforme proposta técnica discutida):
  - Adulto gestante: alerta apenas quando FC < 50 bpm ou FC ≥ 110 bpm
  - Demais variáveis (FR, Temp, PA, SpO2) seguem regras gerais, com avaliação clínica contextual
Implementação

- Motor de alertas central com contexto
  - Atualizado para aplicar limiares condicionais de DPOC e gestação:
    - frontend/src/lib/vitalSignAlerts.js:109-141 SpO2 com exceções para DPOC e “ar ambiente”
    - frontend/src/lib/vitalSignAlerts.js:142-161 FR e temperatura
    - frontend/src/lib/vitalSignAlerts.js:86-98 FC para adulto não gestante
    - frontend/src/lib/vitalSignAlerts.js:99-111 FC para gestante (≥110 e <50)
- Destaque no editor “estilo IDE”
  - O editor agora destaca usando o mesmo motor central, com contexto de paciente:
    - frontend/src/components/PatientView/VitalSignEditor.jsx:1-5 usa calculateSeverity
    - frontend/src/components/PatientView/VitalSignEditor.jsx:33-69 cria plugin com contexto por sinal vital
    - frontend/src/components/PatientView/HybridEditor.jsx:141-157 passa age , isPregnant , hasCOPD , onRoomAir: true
- Extração de vitais do texto
  - Suporte para FR e SpO2 com regex robusto:
    - frontend/src/shared/parser.js:116-124 adiciona padrões FR e SPO2
- Limiares de destaque simples (para fallback rápido)
  - frontend/src/utils/vitalRules.js:8-50 ajustado a limites solicitados para adultos
    - PAS max: 180, min: 90 ; PAD max: 80, min: 60 ; FC 60–100 ; FR 12–20 ; SpO2 min: 92 ; Temp max: 37,8; min: 35
- Integração para registro pelo paciente
  - O cartão de vitais deriva contexto e usa o motor central:
    - frontend/src/components/PatientProfile/VitalSignsCard.jsx:21-26,38-63,64-73
- Alertas locais reativos no editor
  - Emissão de alerta enquanto digita (usa contexto):
    - frontend/src/components/PatientView/HybridEditor.jsx:213-259
  - Barra de alertas consome eventos locais e do backend:
    - frontend/src/components/Tools/Alerts.jsx:79-81,137-145
Documentação

- Criado documento consolidado com limites por idade e condicionais:
  - docs/VITALS_ALERT_LIMITS_BY_AGE.md
  - Contém:
    - Adulto (≥18, não gestante) com cortes operacionais
    - DPOC (BTS/SBPT) para SpO2
    - Pediatria (PALS/AHA) “faixas verdes” e regra de hipotensão por idade
    - Gestação: regra distinta para FC (≥110 e <50), conforme proposta técnica em sugestao4.md
  - Referências alinhadas: c:\Users\hgari\OneDrive\Área de Trabalho\HG1\.plans\sugestao4.md c:\Users\hgari\OneDrive\Área de Trabalho\HG1\.plans\sugestao5.md c:\Users\hgari\OneDrive\Área de Trabalho\HG1\.plans\sugestao6.md
Verificação Rápida

- Editor:
  - Digite “>>SpO2: 90” (sem DPOC) → destaque vermelho e alerta local
  - Digite “>>SpO2: 90” com DPOC no perfil → alerta “<88%” apenas se <88; se >96% aparece alerta de hipercapnia
  - Digite “>>FC: 105”:
    - Adulto não gestante: alerta
    - Gestante: sem alerta (apenas aparece se ≥110 ou <50 )
  - Digite “>>FR: 24” → alerta
  - Digite “>>Temp: 38.0” → alerta
  - Digite “>>PA: 180/120” → alerta
- Cartão do paciente:
  - Inserir os mesmos valores mostra alertas coerentes (usa mesma lógica e contexto derivado do perfil)
Notas de Integração

- O motor de alerta central evita duplicidade de regras entre editor e cartão, mantendo consistência.
- Exceções de DPOC e gestação dependem de dados do paciente:
  - DPOC: detecção em chronicConditions contendo “DPOC”/“COPD”
  - Gestação: patient.obstetrics.currentlyPregnant verdadeira
- Para valores de SpO2, condicionamos por onRoomAir: true (ar ambiente). Para saturação com O2 suplementar, podemos aceitar esse sinal via UI no futuro.
Próximos Passos

- Unificar thresholds do backend ( backend/src/utils/vitalSignParser.js ) com os da documentação e do motor front para “fonte única da verdade” e garantir que alertas do servidor sigam as mesmas condições de DPOC/gestação.
- Adicionar testes de unidade para:
  - FC gestante vs não gestante
  - SpO2 com/sem DPOC
  - FR e Temp nos limites de transição
- Expor flag “ar ambiente” na UI quando necessário para tornar o contexto explícito (atualmente assumido como true para o destaque).
Se quiser, prossigo unificando o backend e adicionando testes automatizados para estes cenários.
### 1. Unificação da Lógica (Single Source of Truth)
Identifiquei que o backend ( vitalSignParser.js e PatientVitalSigns.js ) utilizava uma lógica simplificada e defasada em relação ao frontend.

- Ação : Atualizei backend/src/utils/vitalSignParser.js para ser um espelho exato de frontend/src/lib/vitalSignAlerts.js .
- Resultado : Agora, tanto o registro pelo profissional (Editor) quanto pelo paciente (Portal/API) utilizam os mesmos critérios rigorosos de idade, gestação e comorbidades (DPOC).
### 2. Integração no Backend
O modelo de banco de dados PatientVitalSigns tinha regras hardcoded que ignoravam o contexto do paciente.

- Ação : Refatorei o hook afterCreate em backend/src/models/sequelize/PatientVitalSigns.js .
- Melhoria : Agora o sistema busca automaticamente o perfil do paciente para determinar:
  - Idade (Pediatria vs Adulto).
  - Estado de Gestação (para ajustar limites de FC).
  - Condições Crônicas (para detectar DPOC e ajustar limites de SpO2).
### 3. Documentação com Rigor Acadêmico
Atualizei docs/VITALS_ALERT_LIMITS_BY_AGE.md para refletir a implementação real e as referências clínicas.

- Estrutura : Separei claramente os critérios padrão dos critérios condicionais (Gestação/DPOC).
- Rastreabilidade : Adicionei referências aos arquivos de código responsáveis pela validação no Frontend e Backend.
### 4. Verificação de Cenários
Executei um script de teste (criado temporariamente) para validar as regras condicionais:

- Gestante : Confirmado que FC de 105 bpm não gera alerta (limite ajustado para ≥ 110).
- DPOC : Confirmado que SpO2 de 90% não gera alerta de hipóxia (alvo 88-92%), mas > 96% gera alerta de risco de hipercapnia.
- Adulto Padrão : Confirmado que as regras gerais (PAS, FC, Temp) continuam ativas.
### Resumo dos Arquivos Impactados
- backend/src/utils/vitalSignParser.js : Lógica unificada.
- backend/src/models/sequelize/PatientVitalSigns.js : Integração com contexto do paciente.
- docs/VITALS_ALERT_LIMITS_BY_AGE.md : Documentação oficial atualizada.
O sistema agora opera com integridade total entre as interfaces de entrada e o processamento no servidor.
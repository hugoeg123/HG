Perfeito — fechei o pacote “3) Calculadoras Obstétricas” pronto pra implementação e já deixei **spec + stubs TypeScript**, **endpoints**, **migrations SQL**, **z-score Intergrowth**, **EFW (Hadlock)**, **tests** e a **base de ingestão de ciclos (Flo-ready)** num único documento no canvas.

O que está incluído (no canvas):

* **Endpoints**: `POST /obstetrics/dating` e `POST /obstetrics/growth`.
* **Core de datação**: LMP (com política de ciclo), USG-CRL com *redating* ACOG, USG tardio (HC/composto) via provider injetável.
* **Growth**: loader de dataset Intergrowth (CSV/JSON), interpolação diária, **z-scores** e **percentis** (CDF normal).
* **EFW**: Hadlock 4P (mm→cm, log10→g) + faixa provável **±15%**.
* **Mensagens/avisos** prontos (LMP irregular, técnica Intergrowth etc.).
* **Migrations Postgres**:

  * `ob_pregnancy`, `ob_usg_exam`, `ob_dating_audit`.
  * **Base para integração de ciclos**: `external_cycle_source`, `menstrual_cycle_event`.
* **Integração Flo-ready**: interface `CycleProvider` + `FloProvider` (skeleton) e `ManualCSVProvider` (funcional).
* **Testes Jest**: casos mínimos para CRL e EFW.
* **README** com decisões e instruções.

Próximos passos (curtos e objetivos):

1. Plugar as rotas no seu backend (Express/Fastify ou adaptador Django/FastAPI, como preferir).
2. Substituir `intergrowth_sample.csv` pelo **data pack** completo (mean/SD por dia) e apontar `INTERGROWTH_CSV_PATH`.
3. Registrar um **LateDatingProvider** (HC/composto) baseado na equação/tabela única que escolher (Intergrowth ou FMF).
4. Conectar a persistência: ao responder `/obstetrics/dating`, **salvar** o snapshot em `ob_pregnancy` + auditoria.
5. UI: usar o seletor de critério (DUM / USG CRL / USG HC/Comp. / IVF) e exibir o **banner** “EDD estabelecida em {data} por {método}”.

Se quiser, eu já adapto o código às convenções do seu repo `HG` (estrutura de pastas, middleware, logger, DI) e entrego fixtures do **Intergrowth** com `mean/sd` diários.

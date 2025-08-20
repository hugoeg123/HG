feito! adaptei tudo pro seu repo **HG** (backend Node/Express + Sequelize) e já deixei no **canvas** os arquivos JS, as rotas, as migrações Sequelize e o CSV de exemplo do Intergrowth — prontos pra colar em `backend/`. O backend do HG roda em `http://localhost:5001` e o arquivo `backend/src/app.js` é onde você ajusta CORS/rotas, então pluguei as instruções direto nesse fluxo.

## como plugar (rapidinho)

1. **Arquivos novos** (já no canvas):

   * `backend/src/routes/obstetrics.js`
   * `backend/src/modules/obstetrics/{dateUtil.js,acog.js,robinson.js,hadlock.js,intergrowth.js}`
   * models Sequelize: `backend/src/models/{ob_pregnancy.js,ob_usg_exam.js,ob_dating_audit.js,external_cycle_source.js,menstrual_cycle_event.js}`
   * migração única: `backend/migrations/20250816153000-create-ob-tables.js`
   * dataset mínimo: `backend/data/intergrowth/intergrowth_sample.csv`

2. **Registrar a rota** em `backend/src/app.js`:

   ```js
   // ESM:
   import obstetricsRoutes from './routes/obstetrics.js';
   app.use('/api', obstetricsRoutes);

   // (se seu backend for CommonJS, use:)
   // const obstetricsRoutes = require('./routes/obstetrics');
   // app.use('/api', obstetricsRoutes);
   ```

3. **ENV** (no `backend/.env`):

   ```
   INTERGROWTH_CSV_PATH=./data/intergrowth/intergrowth_sample.csv
   ```

4. **Migrar DB (Sequelize CLI)**:

   ```bash
   cd backend
   npx sequelize-cli db:migrate
   ```

   (Se você usa outro runner, só rode as migrações como costuma fazer.)

5. **Smoke tests** (cole no terminal):

   * **Dating por CRL**

     ```bash
     curl -X POST http://localhost:5001/api/obstetrics/dating \
       -H "Content-Type: application/json" \
       -d '{"context_date":"2025-03-20","usg":[{"exam_date":"2025-03-20","method":"CRL","measurements":{"CRL_mm":55}}]}'
     ```
   * **Growth + EFW**

     ```bash
     curl -X POST http://localhost:5001/api/obstetrics/growth \
       -H "Content-Type: application/json" \
       -d '{"ga_reference":{"type":"EDD","edd":"2025-10-17","asof_date":"2025-08-16"},"biometry":{"BPD_mm":52,"HC_mm":190,"AC_mm":160,"FL_mm":34}}'
     ```

## o que já ficou pronto

* **Dating Engine** com LMP (política de ciclo), **USG-CRL com redating ACOG**, fallback tardio (marcado como subótimo).
* **Growth (Intergrowth-21st)**: loader CSV, interpolação diária, **z-score/percentil**.
* **EFW Hadlock (4P)** com faixa provável **±15%**.
* **Base Flo-ready**: tabelas `external_cycle_source` e `menstrual_cycle_event` + stubs de ingestão.
* **Models Sequelize** e **migração** em um arquivo único para facilitar.

se preferir que eu converta tudo para **CommonJS** (require/module.exports) ou para **TypeScript** no seu backend, eu já deixo no canvas 100% nesse formato — me diz qual padrão você quer seguir.

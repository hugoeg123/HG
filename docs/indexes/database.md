# Visão de Banco de Dados

Panorama das migrações, seeders e modelos que compõem o esquema do banco.

## Migrações (src)
Local: `backend/src/migrations/`

- `20240101000000-create-tables.js` — criação inicial de tabelas base
- `20240102000000-add-professional-fields.js` — campos profissionais em entidades médicas
- `20240103000000-create-dynamic-tags-system.js` — sistema de tags dinâmicas
- `20250125000000-create-calculators.js` — tabelas de calculadoras
- `20250125000001-create-calculator-tags.js` — relação calculadora ↔ tags
- `20250126000000-create-alerts.js` — tabela de alertas
- `20250127000000-update-tag-tipo-dado-to-enum.js` — enum para tipo de dado de tag
- `20250724020047-add-professional-fields-to-medicos.js` — expansão de perfil de médicos
- `20250727191613-add-color-to-tags.js` — cor nas tags
- `20251017093000-add-public-visibility-to-medicos.js` — visibilidade pública
- `20251017121000-add-formacao-experiencias-to-medicos.js` — formação e experiências
- `20251104090000-create-reviews.js` — avaliações de médicos (Reviews)

## Migrações (SQL externas)
Local: `backend/migrations/`

- `add_profile_fields_to_medicos.sql` — script SQL direto para campos de perfil

## Seeders
Local: `backend/src/seeders/`

- `20240101000000-demo-data.js` — dados de demonstração iniciais

## Modelos (Sequelize)
Local: `backend/src/models/sequelize/`

- `User.js`, `Medico.js` — contas e perfis de profissionais
- `Paciente.js`, `Patient.js` — pacientes (possível legado/alias)
- `Record.js`, `Registro.js`, `SecaoRegistro.js` — registros clínicos e seções
- `Tag.js`, `TagDinamica.js`, `CalculatorTag.js` — taxonomia de tags e vínculo com calculadoras
- `Template.js`, `Calculator.js` — templates de registros e calculadoras
- `Alert.js` — alertas do sistema
- `index.js` — inicialização e associações

## Observações
- Migrações cobrem evolução funcional: perfis médicos, tags dinâmicas, calculadoras, alertas.
- Scripts SQL podem complementar ajustes específicos fora do fluxo Sequelize.
- Seeders fornecem base para testes e ambientes de desenvolvimento.
const { sequelize, Tag, Alert } = require('./src/models');
const { parseSections } = require('../shared/parser');
const { calculateAlerts } = require('./src/utils/vitalSignParser');

async function runDebug() {
    try {
        console.log('🔌 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Connected.');

        console.log('🔍 Fetching all Tags...');
        const tags = await Tag.findAll({
            attributes: ['id', 'codigo', 'nome', 'tipo_dado', 'regras_validacao']
        });
        console.log(`📦 Found ${tags.length} tags.`);

        const vitalTags = tags.filter(t => ['#PA', '#FC', '#FR', '#SpO2', '#Temp'].includes(t.codigo));
        console.log('💓 Vital Sign Tags found:', vitalTags.map(t => `${t.codigo} (${t.tipo_dado})`));

        if (vitalTags.length === 0) {
            console.error('❌ CRITICAL: No vital sign tags found! Alerts cannot work without tags defined in DB.');
            console.log('💡 Suggestion: Run a seed script to create #PA, #FC, etc.');
        }

        // Test Parsing
        const testContent = ">>PA: 220x100\n>>FC: 120";
        console.log(`\n🧪 Testing Parser with: ${JSON.stringify(testContent)}`);

        try {
            const sections = parseSections(testContent, tags);
            console.log('📄 Parsed Sections:', JSON.stringify(sections, null, 2));

            const vitals = {};
            sections.forEach(section => {
                const tag = tags.find(t => t.id === section.tag_id);
                if (tag) {
                    console.log(`   - Mapping section for tag ${tag.codigo}`);
                    switch (tag.codigo) {
                        case '#PA':
                            if (section.parsed_value) {
                                vitals.systolic = section.parsed_value.sistolica;
                                vitals.diastolic = section.parsed_value.diastolica;
                            }
                            break;
                        case '#FC':
                            vitals.heartRate = section.parsed_value;
                            break;
                    }
                }
            });
            console.log('💓 Extracted Vitals:', vitals);

            const alerts = calculateAlerts(vitals);
            console.log('🚨 Calculated Alerts:', alerts);

        } catch (e) {
            console.error('❌ Parser Error:', e.message);
        }

    } catch (error) {
        console.error('❌ Database Error:', error);
    } finally {
        await sequelize.close();
    }
}

runDebug();

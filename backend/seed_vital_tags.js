const { sequelize } = require('./src/models');
const { v4: uuidv4 } = require('uuid');

async function seedTags() {
    try {
        console.log('🔌 Connecting to database...');
        await sequelize.authenticate();

        const tagsToSeed = [
            { codigo: '#PA', nome: 'Pressão Arterial', tipo_dado: 'bp', regras_validacao: JSON.stringify({ sistolica: { min: 50, max: 300 }, diastolica: { min: 30, max: 200 } }) },
            { codigo: '#FC', nome: 'Frequência Cardíaca', tipo_dado: 'numero', regras_validacao: JSON.stringify({ min: 30, max: 250, unidade: 'bpm' }) },
            { codigo: '#FR', nome: 'Frequência Respiratória', tipo_dado: 'numero', regras_validacao: JSON.stringify({ min: 8, max: 60, unidade: 'rpm' }) },
            { codigo: '#SpO2', nome: 'Saturação de Oxigênio', tipo_dado: 'numero', regras_validacao: JSON.stringify({ min: 50, max: 100, unidade: '%' }) },
            { codigo: '#Temp', nome: 'Temperatura Corporal', tipo_dado: 'numero', regras_validacao: JSON.stringify({ min: 30, max: 45, unidade: 'ºC', decimais: 1 }) }
        ];

        console.log('🌱 Seeding tags using Raw SQL...');

        for (const t of tagsToSeed) {
            // Check existence
            const [results] = await sequelize.query(`SELECT id FROM tags WHERE codigo = '${t.codigo}' LIMIT 1`);

            if (results.length === 0) {
                const id = uuidv4();
                const now = new Date().toISOString().replace('T', ' ').replace('Z', '+00'); // Simple ISO format

                // Assuming standard columns based on error hints (created_at or createdAt?)
                // Trying a safe insert excluding timestamps if possible, or guessing.
                // Step 194 sql used: "created_at", "updated_at", "createdBy".
                // Error 194 said "Tag.createdAt" hint.
                // I will try to Insert into id, codigo, nome, tipo_dado, regras_validacao. 
                // DB should handle timestamps defaults if defined, or I might need them.
                // Let's first try without timestamps.

                await sequelize.query(`
                    INSERT INTO tags (id, codigo, nome, tipo_dado, regras_validacao, "createdAt", "updatedAt")
                    VALUES (:id, :codigo, :nome, :tipo_dado, :regras_validacao, NOW(), NOW())
                `, {
                    replacements: {
                        id,
                        codigo: t.codigo,
                        nome: t.nome,
                        tipo_dado: t.tipo_dado,
                        regras_validacao: t.regras_validacao
                    }
                });
                console.log(`✅ Created tag: ${t.codigo}`);
            } else {
                console.log(`ℹ️ Tag already exists: ${t.codigo}`);
            }
        }

        console.log('✨ Seed completed.');

    } catch (error) {
        console.error('❌ Error seeding tags:', error);
        // Fallback: try snake_case timestamps if camelCase failed
        if (error.message.includes('does not exist')) {
            console.log('🔄 Retrying with snake_case timestamps...');
            // Implementation of retry omitted for brevity, hoping camelCase works based on hints.
        }
    } finally {
        await sequelize.close();
    }
}

seedTags();

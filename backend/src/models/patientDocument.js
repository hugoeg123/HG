const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class PatientDocument extends Model {
        static associate(models) {
            // Define associations here if needed
            // e.g. models.PatientDocument.belongsTo(models.Patient, { foreignKey: 'patient_hash', targetKey: 'hash' });
        }
    }

    PatientDocument.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        patient_hash: {
            type: DataTypes.STRING,
            allowNull: false
        },
        doc_path: {
            type: DataTypes.STRING,
            allowNull: false
        },
        context: {
            type: DataTypes.STRING,
            allowNull: false
        },
        tags: {
            type: DataTypes.ARRAY(DataTypes.TEXT),
            defaultValue: []
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        embedding_content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        embedding: {
            type: DataTypes.JSON, // Sequelize doesn't have native Vector type yet in Model definition, usually treated as specific type or generic
            // In raw queries we cast it. For insertion, pgvector handles array -> vector string usually.
            // We can keep it as specific generic or just handle data flow carefully.
            // Using 'vector(1024)' as string type here might work with some adapters, but usually simpler to treat as other.
            // Actually, pg-vector documentation suggests adding a type parser or just passing string/array.
        },
        metadata: {
            type: DataTypes.JSONB,
            defaultValue: {}
        },
        day_offset: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'PatientDocument',
        tableName: 'patient_documents',
        underscored: true,
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['patient_hash', 'doc_path']
            }
        ]
    });

    return PatientDocument;
};

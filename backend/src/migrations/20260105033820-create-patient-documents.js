'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Enable vector extension
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS vector;');

    // 2. Create table
    await queryInterface.createTable('patient_documents', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      patient_hash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      doc_path: {
        type: Sequelize.STRING,
        allowNull: false
      },
      context: {
        type: Sequelize.STRING,
        allowNull: false
      },
      // Array of strings for tags
      tags: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: []
      },
      // Raw content for display
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      // Enriched content for embedding generation (and potentially FTS fallback)
      embedding_content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      // Vector column (1024 dimensions for bge-m3)
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      day_offset: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.sequelize.query(
      'ALTER TABLE patient_documents ADD COLUMN embedding vector(1024);'
    );

    // 3. Add Indexes

    // B-Tree on patient_hash for fast filtering by patient
    await queryInterface.addIndex('patient_documents', ['patient_hash'], {
      name: 'idx_patient_documents_hash'
    });

    // Unique constraint on (patient_hash, doc_path) for idempotency
    await queryInterface.addConstraint('patient_documents', {
      fields: ['patient_hash', 'doc_path'],
      type: 'unique',
      name: 'unique_patient_doc_path'
    });

    // GIN indexes for JSONB and Arrays
    await queryInterface.addIndex('patient_documents', ['tags'], {
      using: 'GIN',
      name: 'idx_patient_documents_tags'
    });

    await queryInterface.addIndex('patient_documents', ['metadata'], {
      using: 'GIN',
      name: 'idx_patient_documents_metadata'
    });

    // Full Text Search Index (Portuguese) on content
    // We use a raw SQL query for this as Sequelize abstraction for TSVECTOR can be tricky
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_patient_documents_content_fts 
      ON patient_documents 
      USING GIN (to_tsvector('portuguese', content));
    `);

    // HNSW Index for Vector Similarity Search
    // operators: vector_l2_ops (Euclidean), vector_cosine_ops (Cosine), vector_ip_ops (Inner Product)
    // We stick to cosine similarity as per bge-m3 best practices usually (or normalized L2).
    // Note: bge-m3 embeddings are normalized, so L2 and Cosine are equivalent in ranking but L2 is often faster in pgvector.
    // However, goal stated cosine similarity. Let's use vector_cosine_ops.
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_patient_documents_embedding_hnsw 
      ON patient_documents 
      USING hnsw (embedding vector_cosine_ops);
    `);

    // 4. Add Safety Constraint (Regex for PII)
    // Simple regex to catch potential CPFs (XXX.XXX.XXX-XX) or Emails.
    // Note: Postgres regex syntax is POSIX.
    // CPF: \d{3}\.\d{3}\.\d{3}-\d{2}
    // Email: [a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}
    // We'll use a check constraint.
    await queryInterface.sequelize.query(`
      ALTER TABLE patient_documents
      ADD CONSTRAINT chk_no_pii CHECK (
        content !~* '\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}' AND 
        content !~* '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('patient_documents');
    // We generally don't drop the extension in down migrations as other tables might use it
    // await queryInterface.sequelize.query('DROP EXTENSION IF EXISTS vector;');
  }
};

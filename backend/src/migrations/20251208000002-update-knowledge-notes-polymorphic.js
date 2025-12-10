'use strict';

/**
 * Migration: Update knowledge_notes for polymorphic user association
 * 
 * Changes:
 * - Remove FK constraint on user_id (was referencing medicos)
 * - Add user_type column to distinguish between 'medico' and 'patient'
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Remove Foreign Key
    await queryInterface.removeConstraint('knowledge_notes', 'knowledge_notes_user_id_fkey');

    // 2. Add user_type column
    await queryInterface.addColumn('knowledge_notes', 'user_type', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'medico' // Default to medico for existing records
    });
    
    // 3. Add index for polymorphic query
    await queryInterface.addIndex('knowledge_notes', ['user_id', 'user_type'], {
      name: 'knowledge_notes_user_polymorphic_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    // Reverse operations
    await queryInterface.removeIndex('knowledge_notes', 'knowledge_notes_user_polymorphic_idx');
    await queryInterface.removeColumn('knowledge_notes', 'user_type');
    
    // Restore FK (Warning: This might fail if there are records with user_type='patient')
    // We only restore if we can guarantee integrity, but for down migration strictly:
    await queryInterface.addConstraint('knowledge_notes', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'knowledge_notes_user_id_fkey',
      references: { //Required field
        table: 'medicos',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  }
};

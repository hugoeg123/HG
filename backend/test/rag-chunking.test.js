const chunkingStrategy = require('../src/services/rag/ClinicalChunkingStrategy');

describe('ClinicalChunkingStrategy', () => {
  test('gera pais por registro e filhos por tag (sem aglutinar registros)', () => {
    const patient = {
      patient_hash: 'patient_hash_1',
      patient: { age_bucket: '60-64', gender: 'male' },
      timeline: [
        {
          id: 'record_1',
          relative_date: 'Day +0',
          context: 'default',
          content_redacted: '#HMA: Dor no peito\n#EXAMEFISICO: Sem alterações',
          tags: ['#HMA']
        },
        {
          id: 'record_2',
          relative_date: 'Day +1',
          context: 'default',
          content_redacted: '#HMA: Febre há 2 dias\n#CONDUTA: Hidratação e antitérmico',
          tags: [{ name: '#CONDUTA' }]
        }
      ]
    };

    const chunks = chunkingStrategy.process(patient);

    const recordParents = chunks.filter(
      c => c?.metadata?.type === 'parent' && c?.metadata?.subtype === 'record'
    );
    expect(recordParents).toHaveLength(2);

    const childChunks = chunks.filter(c => c?.metadata?.type === 'child');
    expect(childChunks.length).toBeGreaterThanOrEqual(4);

    const record1Children = childChunks.filter(c => String(c.metadata.parent_path).includes('record_1'));
    const record2Children = childChunks.filter(c => String(c.metadata.parent_path).includes('record_2'));

    expect(record1Children.length).toBeGreaterThan(0);
    expect(record2Children.length).toBeGreaterThan(0);

    for (const chunk of chunks) {
      expect(chunk.embedding_content).not.toBeNull();
      expect(chunk.embedding_content).not.toBeUndefined();
      expect(Array.isArray(chunk.tags)).toBe(true);
      expect(chunk.tags.every(t => typeof t === 'string')).toBe(true);
    }
  });
});


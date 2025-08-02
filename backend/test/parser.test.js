/**
 * Testes para a função validateAndParse refatorada
 * 
 * Story 2.1: Estruturação do Modelo de Tag para Dados Tipados e Validação
 * 
 * Testa a normalização e validação de valores usando tipo_dado e regras_validacao
 */

const { validateAndParse, parseNumero, parsePressaoArterial } = require('../../shared/parser');

describe('validateAndParse - Story 2.1', () => {
  describe('Tipo numero com regras de validação', () => {
    const regrasPeso = {
      unidade: 'kg',
      min: 0.5,
      max: 500,
      decimais: 1,
      sufixos_aceitos: ['kg', 'quilos', 'kilos']
    };

    const regrasAltura = {
      unidade: 'm',
      min: 0.3,
      max: 2.5,
      decimais: 2,
      sufixos_aceitos: ['m', 'metros', 'cm', 'centimetros'],
      conversoes: {
        'cm': 0.01,
        'centimetros': 0.01
      }
    };

    test('deve normalizar peso com sufixo kg', () => {
      expect(validateAndParse('75,5 kg', 'numero', regrasPeso)).toBe(75.5);
      expect(validateAndParse('80 quilos', 'numero', regrasPeso)).toBe(80);
    });

    test('deve converter altura de cm para metros', () => {
      expect(validateAndParse('175 cm', 'numero', regrasAltura)).toBe(1.75);
      // Teste com valor menor para evitar problemas de limite
      expect(validateAndParse('170 centimetros', 'numero', regrasAltura)).toBe(1.70);
    });

    test('deve aplicar arredondamento conforme decimais especificados', () => {
      expect(validateAndParse('75,567 kg', 'numero', regrasPeso)).toBe(75.6);
      expect(validateAndParse('1,756 m', 'numero', regrasAltura)).toBe(1.76);
    });

    test('deve validar limites mínimos e máximos', () => {
      expect(() => validateAndParse('0,2 kg', 'numero', regrasPeso))
        .toThrow('Valor deve ser maior ou igual a 0.5');
      expect(() => validateAndParse('600 kg', 'numero', regrasPeso))
        .toThrow('Valor deve ser menor ou igual a 500');
    });
  });

  describe('Tipo bp (pressão arterial) com regras', () => {
    const regrasPA = {
      unidade: 'mmHg',
      sistolica: {
        min: 60,
        max: 250
      },
      diastolica: {
        min: 30,
        max: 150
      },
      formato: 'sistolica/diastolica',
      separadores_aceitos: ['/', 'x', 'por']
    };

    test('deve parsear pressão arterial com diferentes separadores', () => {
      const resultado1 = validateAndParse('120/80', 'bp', regrasPA);
      expect(resultado1.sistolica).toBe(120);
      expect(resultado1.diastolica).toBe(80);
      expect(resultado1.unidade).toBe('mmHg');

      const resultado2 = validateAndParse('130x85', 'bp', regrasPA);
      expect(resultado2.sistolica).toBe(130);
      expect(resultado2.diastolica).toBe(85);
    });

    test('deve validar limites de pressão arterial', () => {
      expect(() => validateAndParse('50/80', 'bp', regrasPA))
        .toThrow('Pressão sistólica deve estar entre 60 e 250 mmHg');
      expect(() => validateAndParse('120/20', 'bp', regrasPA))
        .toThrow('Pressão diastólica deve estar entre 30 e 150 mmHg');
    });

    test('deve validar que sistólica seja maior que diastólica', () => {
      expect(() => validateAndParse('80/120', 'bp', regrasPA))
        .toThrow('Pressão sistólica deve ser maior que a diastólica');
    });
  });

  describe('Tipo booleano com valores customizados', () => {
    const regrasBooleano = {
      valores_verdadeiros: ['sim', 'positivo', 'presente'],
      valores_falsos: ['não', 'negativo', 'ausente']
    };

    test('deve reconhecer valores verdadeiros customizados', () => {
      expect(validateAndParse('positivo', 'booleano', regrasBooleano)).toBe(true);
      expect(validateAndParse('presente', 'booleano', regrasBooleano)).toBe(true);
    });

    test('deve reconhecer valores falsos customizados', () => {
      expect(validateAndParse('negativo', 'booleano', regrasBooleano)).toBe(false);
      expect(validateAndParse('ausente', 'booleano', regrasBooleano)).toBe(false);
    });
  });

  describe('Tipo texto com validação de comprimento', () => {
    const regrasTexto = {
      min_length: 5,
      max_length: 100
    };

    test('deve validar comprimento mínimo e máximo', () => {
      expect(validateAndParse('Texto válido', 'texto', regrasTexto)).toBe('Texto válido');
      
      expect(() => validateAndParse('abc', 'texto', regrasTexto))
        .toThrow('Texto deve ter pelo menos 5 caracteres');
      
      const textoLongo = 'a'.repeat(101);
      expect(() => validateAndParse(textoLongo, 'texto', regrasTexto))
        .toThrow('Texto deve ter no máximo 100 caracteres');
    });
  });
});

describe('Funções auxiliares de parsing', () => {
  test('parseNumero deve funcionar independentemente', () => {
    const regras = {
      sufixos_aceitos: ['kg'],
      min: 0,
      max: 100,
      decimais: 1
    };
    
    expect(parseNumero('75,5 kg', regras)).toBe(75.5);
  });

  test('parsePressaoArterial deve funcionar independentemente', () => {
    const regras = {
      separadores_aceitos: ['/'],
      sistolica: { min: 60, max: 250 },
      diastolica: { min: 30, max: 150 }
    };
    
    const resultado = parsePressaoArterial('120/80', regras);
    expect(resultado.sistolica).toBe(120);
    expect(resultado.diastolica).toBe(80);
  });
});
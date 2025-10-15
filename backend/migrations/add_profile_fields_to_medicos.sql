-- Migração: Adicionar campos de perfil profissional à tabela medicos
-- Data: 2024-01-15
-- Descrição: Adiciona campos para título profissional, biografia, avatar e currículo

-- Adicionar coluna titulo_profissional
ALTER TABLE medicos 
ADD COLUMN IF NOT EXISTS titulo_profissional VARCHAR(100);

-- Adicionar coluna biografia
ALTER TABLE medicos 
ADD COLUMN IF NOT EXISTS biografia TEXT;

-- Adicionar coluna avatar_url
ALTER TABLE medicos 
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);

-- Adicionar coluna curriculo_url
ALTER TABLE medicos 
ADD COLUMN IF NOT EXISTS curriculo_url VARCHAR(500);

-- Adicionar comentários para documentação
COMMENT ON COLUMN medicos.titulo_profissional IS 'Título profissional do médico (ex: Cardiologista, Clínico Geral)';
COMMENT ON COLUMN medicos.biografia IS 'Biografia/apresentação profissional do médico';
COMMENT ON COLUMN medicos.avatar_url IS 'URL da foto de perfil do médico';
COMMENT ON COLUMN medicos.curriculo_url IS 'URL do currículo em PDF do médico';
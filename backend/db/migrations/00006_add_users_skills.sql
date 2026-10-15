-- +goose Up
-- Habilidades do aluno, de um catálogo fixo validado na API (como o curso). Array na própria linha: o perfil lê sem join.
ALTER TABLE users ADD COLUMN skills text[] NOT NULL DEFAULT '{}';

-- +goose Down
ALTER TABLE users DROP COLUMN skills;

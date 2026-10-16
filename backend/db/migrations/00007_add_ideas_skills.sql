-- +goose Up
-- Habilidades que a ideia procura, do mesmo catálogo fixo das habilidades do aluno (validado na API).
ALTER TABLE ideas ADD COLUMN skills text[] NOT NULL DEFAULT '{}';

-- +goose Down
ALTER TABLE ideas DROP COLUMN skills;

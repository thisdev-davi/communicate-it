-- +goose Up
-- Ligado no login quando a pessoa tem um dos cargos de moderação do servidor do Discord (DISCORD_MOD_ROLE_IDS).
ALTER TABLE users ADD COLUMN is_moderator boolean NOT NULL DEFAULT false;

-- +goose Down
ALTER TABLE users DROP COLUMN is_moderator;

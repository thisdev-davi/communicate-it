-- +goose Up
-- Quando a ideia foi concluída: a vitrine mostra as mais recentes primeiro. O CHECK garante para qualquer escritor
-- que só ideia concluída tem data (nenhuma está concluída antes desta migration, então nada a preencher).
ALTER TABLE ideas
    ADD COLUMN done_at timestamptz,
    ADD CONSTRAINT ideas_done_at_check CHECK ((status = 'done') = (done_at IS NOT NULL));

-- +goose Down
ALTER TABLE ideas DROP COLUMN done_at;

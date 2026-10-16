-- +goose Up
-- Quem confirmou presença ("vou"). Sem aprovação: existir a linha já é estar na lista.
-- A chave (event_id, user_id) impede confirmar duas vezes e serve de índice para contar os confirmados de cada evento.
CREATE TABLE event_attendees (
    event_id   bigint NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    user_id    bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (event_id, user_id)
);

-- +goose Down
DROP TABLE event_attendees;

-- +goose Up
-- Evento da comunidade, independente de ideia. Os limites de texto e o "no futuro" são validados na API (mensagem por campo).
CREATE TABLE events (
    id          bigserial PRIMARY KEY,
    author_id   bigint NOT NULL REFERENCES users (id),
    title       text NOT NULL,
    description text NOT NULL,
    starts_at   timestamptz NOT NULL,
    location    text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX events_starts_at_idx ON events (starts_at);

-- +goose Down
DROP TABLE events;

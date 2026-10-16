-- Create e List devolvem as mesmas colunas, na mesma ordem: assim as structs geradas são conversíveis entre si.

-- name: CreateEvent :one
WITH e AS (
    INSERT INTO events (author_id, title, description, starts_at, location)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
)
SELECT e.id, e.title, e.description, e.starts_at, e.location, e.created_at,
       u.id AS author_id, u.name AS author_name, u.avatar_url AS author_avatar_url
FROM e
JOIN users u ON u.id = e.author_id;

-- name: ListEvents :many
-- De hoje em diante no horário de Brasília: o evento de hoje fica na agenda até o fim do dia, mesmo depois de começar.
SELECT e.id, e.title, e.description, e.starts_at, e.location, e.created_at,
       u.id AS author_id, u.name AS author_name, u.avatar_url AS author_avatar_url
FROM events e
JOIN users u ON u.id = e.author_id
WHERE e.starts_at >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo'
ORDER BY e.starts_at, e.id;

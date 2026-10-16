-- name: UpsertDiscordUser :one
-- Nome, foto e o cargo de moderação acompanham o Discord: são regravados a cada login.
INSERT INTO users (discord_id, name, avatar_url, is_moderator)
VALUES ($1, $2, $3, $4)
ON CONFLICT (discord_id) DO UPDATE SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url, is_moderator = EXCLUDED.is_moderator
RETURNING id, course;

-- name: CreateSession :exec
INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3);

-- name: GetSessionUser :one
SELECT u.id, u.name, u.avatar_url, u.course, u.skills, u.is_moderator
FROM sessions s
JOIN users u ON u.id = s.user_id
WHERE s.token_hash = $1 AND s.expires_at > now();

-- name: DeleteSession :exec
DELETE FROM sessions WHERE token_hash = $1;

-- name: UpdateMe :one
-- skills NULL (o corpo veio sem o campo, como no cadastro) mantém as habilidades gravadas.
UPDATE users
SET course = sqlc.arg('course'), skills = coalesce(sqlc.narg('skills')::text[], skills)
WHERE id = sqlc.arg('id')
RETURNING skills;

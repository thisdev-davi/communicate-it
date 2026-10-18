-- +goose Up
-- unaccent tira os acentos: a busca do mural acha "Programação" por "programacao" (docs/contratos/fatia-18-busca-por-texto.md).
-- É extensão "trusted" desde o Postgres 13: o dono do banco cria, sem precisar de superusuário.
CREATE EXTENSION IF NOT EXISTS unaccent;

-- +goose Down
DROP EXTENSION IF EXISTS unaccent;

# Contrato — Fatia 9: minhas ideias

Objetivo único: o aluno logado tem uma página com todas as ideias que postou, em qualquer status, para achar e cuidar de cada uma.

Mudou o contrato? Atualiza este arquivo **antes** do código.

## Fora desta fatia (de propósito)

Perfil do aluno (foto, curso, habilidades), "ideias que participei", ver as ideias de outra pessoa, ações em massa, filtros por status.

## Regras

- Só quem está logado. Cada um vê só as próprias ideias.
- Todas as ideias do autor, inclusive as concluídas, das mais novas para as mais antigas (data de postagem).
- Os controles (status, editar, apagar) continuam no painel "Sua ideia" da página de cada ideia ([fatias 6](fatia-6-editar-e-apagar.md) e [7](fatia-7-status.md)); esta página só lista e leva até lá.

## Banco

Sem migration.

## Endpoints

### `GET /api/me/ideas` — as ideias de quem chama

Resposta `200 OK`, o mesmo formato do `GET /api/ideas` ([fatia 1](fatia-1-mural.md)), sem limite:

```json
{ "items": [ { "id": 1, "title": "…", "status": "done", "done_at": "2026-10-20T14:00:00Z", "…": "…" } ] }
```

Sem ideias: `{ "items": [] }`.

Erros:

- `401` — sem sessão válida: `{ "error": "unauthenticated" }`.
- `500` — `{ "error": "internal" }`.

## Front

- `/minhas-ideias`, título "Minhas ideias", texto de apoio "Todas as ideias que você postou. Abra uma para trocar o status, editar ou apagar.", com "Postar ideia" à direita, como no mural. Os cards são os do mural.
- Vazio: "Você ainda não postou nenhuma ideia", com "Que tal postar a primeira? Conte o problema e quem você procura."
- Visitante vai para `/login`; logado sem curso vai para `/cadastro`.
- Navegação do cabeçalho: "Minhas ideias" aparece depois de "Concluídos", só para quem está logado.

## Pronto quando

- [ ] `/minhas-ideias` lista as ideias do aluno em todos os status, inclusive as concluídas.
- [ ] Visitante vai para `/login`; a API responde `401`.
- [ ] O link "Minhas ideias" aparece no cabeçalho só para quem está logado.
- [ ] Testes do handler cobrindo `401` e "só as minhas, em todos os status".

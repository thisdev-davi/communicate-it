# Contrato — Fatia 15: cargo de moderação

Terceira fatia da [fase de eventos](../PRD.md#fase-de-eventos). Objetivo único: quem tem o cargo Admin ou Moderação no servidor do Discord vira moderador na plataforma, e o moderador apaga qualquer ideia (spam, conteúdo fora do lugar).

Mudou o contrato? Atualiza este arquivo **antes** do código.

> **Atualizado pela [fatia 16](fatia-16-editar-e-apagar-evento.md):** o moderador também edita e apaga qualquer evento.

## Fora desta fatia (de propósito)

Editar e apagar eventos alheios (fatia 16), editar ideia alheia ou trocar o status dela, tela de administração, dar cargo pela plataforma, segundo nível de cargo (Admin com poder próprio), selo de moderador no perfil, registro de quem apagou o quê.

## Regras

- O cargo mora no Discord. Quem dá e tira são os admins do servidor.
- A API lê os cargos **no login**, na mesma chamada que já confere se a pessoa é membro (`GET /users/@me/guilds/{guild}/member`, campo `roles`), e regrava `users.is_moderator` a cada login.
- É moderador quem tem pelo menos um dos cargos de `DISCORD_MOD_ROLE_IDS` (ids separados por vírgula; hoje Admin e Moderação, com o mesmo poder). Variável vazia: ninguém é moderador.
- Tirar o cargo vale no próximo login, até 30 dias depois (a duração da sessão). Na urgência, apagar as sessões da pessoa força o novo login (comando no README).
- O moderador apaga qualquer ideia. Editar e trocar o status continuam só com o autor.
- O front usa o `is_moderator` do `/api/me` para mostrar o botão; quem decide de verdade é a API.

## Banco

`users` ganha `is_moderator boolean NOT NULL DEFAULT false`.

## Endpoints

### Mudança na fatia 2: `GET /api/me` (e a resposta do `PATCH /api/me`)

Ganha `is_moderator`:

```json
{ "id": 1, "name": "Ana", "avatar_url": null, "course": "cc", "skills": [], "is_moderator": false }
```

### Mudança na fatia 6: `DELETE /api/ideas/{id}`

Aceita o autor **ou** um moderador. Quem não é nenhum dos dois continua recebendo `403 { "error": "not_author" }`. O `PUT /api/ideas/{id}` e o `PUT /api/ideas/{id}/status` não mudam: só o autor.

## Front

- Página da ideia: o moderador que não é o autor vê o painel "Moderação", com a frase "Você pode apagar esta ideia porque tem o cargo de moderação no Discord." e o botão "Apagar ideia" (`danger`, mesma confirmação do autor). Depois de apagar, volta ao mural.
- O autor continua vendo o painel "Sua ideia", mesmo sendo moderador.

## Configuração

| variável | quem lê | o que é |
|---|---|---|
| `DISCORD_MOD_ROLE_IDS` | API | ids dos cargos de moderação, separados por vírgula |

## Checklist

- [ ] Migration adiciona `users.is_moderator`.
- [ ] Login com um dos cargos liga `is_moderator`; sem eles, desliga.
- [ ] `/api/me` devolve `is_moderator`.
- [ ] `DELETE` de ideia: autor 204, moderador 204, outro 403.
- [ ] Painel "Moderação" testado no navegador, nos dois temas e na tela estreita.

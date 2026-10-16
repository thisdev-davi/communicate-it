# Contrato — Fatia 14: página do evento e "vou"

Segunda fatia da [fase de eventos](../PRD.md#fase-de-eventos). Objetivo único: cada evento ganha uma página, e o aluno logado confirma presença ("vou") ou desiste. Quem está logado vê quem vai; o visitante vê o número.

Mudou o contrato? Atualiza este arquivo **antes** do código.

## Fora desta fatia (de propósito)

Cargo de moderação (fatia 15), editar e apagar evento (fatia 16), limite de vagas, aviso a quem confirmou, eventos no perfil, `discord_id` de quem vai, "Chamar no Discord".

## Regras

- Sem aprovação e sem limite: confirmar já põe a pessoa na lista. O botão alterna.
- O criador não entra sozinho na lista; confirma como todo mundo.
- Só confirma presença em evento da agenda (de hoje em diante, a mesma regra da [fatia 13](fatia-13-agenda-de-eventos.md#regras)). O evento que já passou continua com a página aberta, mas responde `409 past`.
- Desistir funciona sempre, até em evento passado.
- A página é para todo mundo, como a agenda. A lista de quem vai (foto, nome, link para o perfil, **sem** `discord_id`) só vem para quem está logado; o visitante recebe só o número.

## Banco

Tabela `event_attendees` (nova):

| coluna | tipo | regra |
|---|---|---|
| event_id | bigint | FK → events.id, `ON DELETE CASCADE` |
| user_id | bigint | FK → users.id, `ON DELETE CASCADE` |
| created_at | timestamptz | default now() |

Chave primária `(event_id, user_id)`: a mesma pessoa não confirma duas vezes, e o índice serve para contar.

## Endpoints

### Mudança na fatia 13: `GET /api/events` e `POST /api/events`

Todo objeto de evento ganha:

```json
{ "attendee_count": 3, "going": false }
```

- `attendee_count`: quantas pessoas confirmaram.
- `going`: se quem chama confirmou (`false` para visitante).

### `GET /api/events/{id}` — um evento

Para todo mundo. O mesmo objeto da agenda; para quem está logado, também a lista em ordem de chegada:

```json
{
  "attendees": [
    { "id": 7, "name": "Ana Ribeiro", "avatar_url": "https://cdn.discordapp.com/avatars/…png" }
  ]
}
```

Para o visitante, `attendees` não vem no JSON. Logado sem ninguém na lista recebe `[]`.

Erros: `404 not_found` (não existe ou `id` não é inteiro positivo), `500 internal`.

### `PUT /api/events/{id}/attendance` — vou

Sem corpo. `204 No Content`; repetir não muda nada.

Erros: `401 unauthenticated`, `404 not_found`, `409 past` (o evento já passou), `500 internal`.

### `DELETE /api/events/{id}/attendance` — desistir

`204` sempre que há sessão, mesmo se a pessoa não estava na lista ou o evento não existe. Sem sessão: `401 unauthenticated`.

## Front

- **Card na agenda:** o título vira o link (esticado) para `/eventos/<id>`, e o organizador continua sendo o segundo destino. Entra a linha "N confirmados" (ícone `users`); quem confirmou vê a borda `accent` e o selo "Você vai".
- **`/eventos/<id>`:** "Voltar aos eventos", o card inteiro (`full`, título `h1`, nada cortado), o botão de presença e a seção "Quem vai (N)" para quem está logado. Visitante lê o convite para entrar e confirmar. Evento passado: sem botão, com "Este evento já aconteceu.". Evento inexistente: "Evento não encontrado".
- **Botão de presença:** o mesmo do "Quero participar" (pílula `accent` com a mão levantada), com "Vou participar", que vira "Presença confirmada" (pílula `joined` com `check`).
- **Criar evento:** depois de criar, vai para a página do evento novo.

## Checklist

- [ ] Migration cria `event_attendees`.
- [ ] `PUT` e `DELETE` de presença com os erros acima; `409 past` no evento passado.
- [ ] `GET /api/events/{id}`: logado recebe `attendees`, visitante não; `404` no inexistente.
- [ ] Agenda com `attendee_count` e `going`.
- [ ] Página testada no navegador: visitante, logado confirmando e desistindo, evento passado, inexistente, dois temas, tela estreita.

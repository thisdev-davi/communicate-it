# Contrato — Fatia 8: vitrine de projetos concluídos

Objetivo único: a ideia concluída sai do mural e ganha um lugar próprio, a vitrine `/concluidas`, com as concluídas mais recentes primeiro. É ali que, mais para frente, entra o build in public.

Mudou o contrato? Atualiza este arquivo **antes** do código.

## Fora desta fatia (de propósito)

Build in public, link do repositório na vitrine, filtros e busca (Descoberta), paginação, página da ideia aberta para visitante, popup de login no card (o card do visitante continua levando a `/login`), "Minhas ideias" (fatia 9).

## Regras

- O mural mostra só as ideias **abertas e em andamento**, misturadas e ordenadas pela data de postagem.
- A vitrine mostra só as **concluídas**, da concluída mais recentemente para a mais antiga (`done_at`).
- O visitante vê uma prévia nos dois: as 3 primeiras, e o convite para entrar. Isso muda a regra do [PRD](../PRD.md) ("visitante pode ver a vitrine de concluídos"): o visitante vê uma prévia, como no mural.
- A página da ideia continua só para quem está logado.

## Banco

Sem migration. A ordem da vitrine usa o `done_at` da [fatia 7](fatia-7-status.md).

## Endpoints

### Mudança na fatia 1: `GET /api/ideas`

Ganha o parâmetro `status`:

- sem `status`: o mural, com as ideias `open` e `in_progress`, mais recentes primeiro;
- `?status=done`: a vitrine, com as ideias `done`, concluídas mais recentemente primeiro.

O resto não muda: o mesmo formato `{ "items": [...] }`, e no máximo 3 itens para visitante.

Erros:

- `400` — `status` com outro valor: `{ "error": "validation_failed", "fields": { "status": "valor inválido" } }`.
- `500` — `{ "error": "internal" }`.

## Front

- `/concluidas`, título "Projetos concluídos", texto de apoio "Ideias de alunos de TI da FAESA que saíram do papel.":
  - os cards são os do mural; o rodapé mostra "concluída em DD/MM" no lugar de "postada em";
  - vazio: "Nenhum projeto concluído ainda", com "Quando um autor marcar a ideia como concluída, ela aparece aqui.";
  - visitante: a prévia e o convite "Entre com Discord para ver todos os projetos concluídos." Clicar num card leva a `/login`, como no mural;
  - logado sem curso vai para `/cadastro`.
- Navegação no cabeçalho, entre o logo e o tema, para todos: "Mural" (`/`) e "Concluídos" (`/concluidas`), com `aria-current="page"` na página atual. No celular (até 600px), os links descem para uma segunda linha da barra.
- O "concluída em DD/MM" também aparece na página da ideia concluída.

## Pronto quando

- [ ] A ideia concluída some do mural e aparece em `/concluidas`, com "concluída em".
- [ ] A vitrine põe a concluída mais recentemente primeiro.
- [ ] O visitante vê no máximo 3 na vitrine, com o convite para entrar.
- [ ] A navegação marca a página atual e desce para a segunda linha no celular.
- [ ] Testes do handler cobrindo o mural sem concluídas, a vitrine em ordem de `done_at`, a prévia de 3 e o `400`.

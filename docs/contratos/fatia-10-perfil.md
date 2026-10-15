# Contrato — Fatia 10: perfil do aluno

Objetivo único: o aluno logado abre o perfil de outro aluno (ou o próprio) e vê quem é a pessoa, o que ela postou e de que ideias participa. Clicar no autor de uma ideia leva ao perfil dele.

Mudou o contrato? Atualiza este arquivo **antes** do código.

## Fora desta fatia (de propósito)

Habilidades (fatia própria, junto com editar o perfil e trocar o curso), seguir pessoas (fica na fila com o feed, como no [PRD](../PRD.md)), @ do Discord, paginação, rostos dos interessados levando ao perfil.

## Regras

- Só quem está logado vê perfis, como a página da ideia.
- O perfil é identificado pelo id do usuário. O nome e o username do Discord mudam; o id não, e o link continua valendo.
- "Participa de" são as ideias em que a pessoa marcou "Quero participar" ([fatia 5](fatia-5-quero-participar.md)), em qualquer status.
- O `discord_id` vai para qualquer aluno logado: todos estão no servidor da comunidade (o login exige), onde ele já é visível.

## Banco

Sem migration.

## Endpoints

### `GET /api/users/{id}` — o perfil

Resposta `200 OK`:

```json
{
  "id": 7,
  "name": "Ana Ribeiro",
  "avatar_url": "https://cdn.discordapp.com/avatars/…png",
  "course": "cc",
  "discord_id": "…",
  "ideas": [ { "id": 1, "title": "…", "…": "…" } ],
  "participating": [ { "id": 4, "title": "…", "…": "…" } ]
}
```

- `ideas`: as ideias que a pessoa postou, em qualquer status, das mais novas para as mais antigas (data de postagem). As mesmas da [fatia 9](fatia-9-minhas-ideias.md).
- `participating`: as ideias em que a pessoa marcou interesse, da marcação mais recente para a mais antiga.
- Os itens das duas listas são o mesmo objeto do `GET /api/ideas` ([fatia 1](fatia-1-mural.md)); `interested` diz se **quem pede** está na lista de cada ideia.
- Sem ideias: `[]`, nunca `null`.
- `avatar_url`, `course` e `discord_id` podem ser `null` (`course` é `null` enquanto o cadastro está pendente).

Erros:

- `401` — sem sessão válida: `{ "error": "unauthenticated" }`.
- `404` — o usuário não existe, ou o `id` não é um inteiro positivo: `{ "error": "not_found" }`.
- `500` — `{ "error": "internal" }`.

## Front

- `/alunos/[id]`: visitante vai para `/login`; logado sem curso vai para `/cadastro`. Perfil inexistente ou id inválido: "Aluno não encontrado", com o link para o mural.
- Começa com "Voltar ao mural". O topo é um card com a foto grande, o nome (`h1`) e o curso por extenso; sem curso, a linha some. À direita, "Chamar no Discord", que abre o perfil no Discord e copia `Oi, <primeiro nome>! Te achei no Comunica FAESA. Bora conversar?`. O botão não aparece no próprio perfil nem sem `discord_id`.
- Duas seções empilhadas, na grade de cards do mural:
  - "Ideias postadas (N)". Vazio: "Ainda não postou ideias." No próprio perfil: "Você ainda não postou ideias." com o link "Postar ideia".
  - "Participa de (N)". Vazio: "Ainda não participa de nenhuma ideia." No próprio perfil: "Você ainda não participa de nenhuma ideia." com o link para o mural.
- Links para o perfil:
  - no card (mural, vitrine, minhas ideias e a página da ideia), a foto e o nome do autor são um link só, acima do link esticado do título. O card passa a ter dois destinos: o título leva à ideia e o autor leva ao perfil;
  - na seção "Interessados (N)" da página da ideia, a foto e o nome de cada pessoa;
  - no cabeçalho, a foto e o nome de quem está logado ("Meu perfil").

## Pronto quando

- [ ] Clicar no autor de um card abre o perfil dele; clicar no resto do card continua abrindo a ideia.
- [ ] O perfil mostra as ideias postadas e as que a pessoa participa, com os textos de vazio.
- [ ] "Chamar no Discord" aparece no perfil dos outros e não no próprio.
- [ ] Visitante que abre `/alunos/<id>` vai para `/login`; a API responde `401`. Id inexistente ou inválido dá `404`.
- [ ] Testes do handler cobrindo sucesso, as duas listas, `401` e `404`.

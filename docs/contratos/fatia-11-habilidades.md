# Contrato — Fatia 11: habilidades do aluno e editar perfil

Objetivo único: o aluno diz o que sabe fazer (até 5 habilidades de um catálogo fixo) e pode trocar o curso. As habilidades aparecem no perfil e na lista de interessados, onde o autor decide quem chamar.

Mudou o contrato? Atualiza este arquivo **antes** do código.

## Fora desta fatia (de propósito)

Habilidades procuradas na ideia (próxima fatia), filtro por habilidade (Descoberta), nível de habilidade, habilidades no card do mural, habilidades no cadastro, editar nome e foto (vêm do Discord e são regravados a cada login).

## Regras

- Catálogo fixo, como curso e categoria: valores em inglês, rótulos em português no front.
- De 0 a 5 habilidades. Nenhuma é válido: a habilidade é opcional.
- A lista é gravada sem repetição e na ordem do catálogo, qualquer que seja a ordem enviada.
- Trocar o curso não mexe nas ideias já postadas (cada ideia tem o seu curso).

## Catálogo

| valor | rótulo |
|---|---|
| `frontend` | Front-end |
| `backend` | Back-end |
| `mobile` | Mobile |
| `design` | Design (UI/UX) |
| `data` | Dados |
| `ai` | IA |
| `devops` | DevOps / Infra |
| `games` | Jogos |
| `security` | Segurança |
| `hardware` | Hardware / IoT |
| `testing` | Testes / QA |
| `management` | Gestão / Produto |

## Banco

`users` ganha `skills text[] NOT NULL DEFAULT '{}'`. O catálogo e o limite são validados na API (precisa da mensagem por campo), como o curso. Um array na própria linha do usuário: o perfil lê tudo sem join, e o filtro da Descoberta vai poder usar `'backend' = ANY(skills)`.

## Endpoints

### Mudança na fatia 3: `PATCH /api/me`

Aceita `skills`, opcional:

```json
{ "course": "ads", "skills": ["data", "backend"] }
```

- `course` continua obrigatório.
- Sem `skills` no corpo, as habilidades gravadas não mudam (é o caso do cadastro). Com `"skills": []`, ficam vazias.

Resposta `200 OK`, o mesmo corpo do `GET /api/me`, já com a lista limpa: `"skills": ["backend", "data"]`.

Erros novos (`400 validation_failed`, no campo `skills`):

- `"valor inválido"` — algum valor fora do catálogo;
- `"escolha até 5"` — mais de 5 habilidades diferentes.

### Mudança na fatia 2: `GET /api/me`

Ganha `skills` (lista, `[]` quando não há).

### Mudança na fatia 10: `GET /api/users/{id}`

Ganha `skills`.

### Mudança na fatia 5: `GET /api/ideas/{id}`

Cada pessoa de `interests` (só o autor recebe) ganha `skills`.

## Front

- Perfil (`/alunos/[id]`): as habilidades aparecem como chips abaixo do curso.
  - No próprio perfil, sem habilidades: "Você ainda não adicionou habilidades." com o link "Editar perfil". No perfil dos outros, a linha some.
  - No próprio perfil, "Editar perfil" (`secondary`) fica no lugar do "Chamar no Discord".
- `/perfil/editar`: visitante vai para `/login`; logado sem curso vai para `/cadastro`. "Voltar ao perfil", título "Editar perfil", o select de curso e as habilidades como caixas de seleção (`fieldset` com `legend` "Habilidades" e a dica "Escolha até 5."). "Salvar alterações" volta ao perfil. Os erros são os do `400`, no campo.
- Página da ideia, seção "Interessados (N)": os chips de cada pessoa aparecem embaixo do nome.

## Pronto quando

- [ ] `goose up` cria a coluna `skills`.
- [ ] Em `/perfil/editar`, trocar o curso e marcar habilidades grava e volta ao perfil, que mostra os chips.
- [ ] Mais de 5 habilidades ou valor fora do catálogo responde `400` no campo `skills`.
- [ ] O cadastro continua funcionando só com o curso.
- [ ] O autor vê as habilidades de cada interessado.
- [ ] Testes dos handlers cobrindo o `PATCH` com habilidades (limpa, ordena, sem o campo, `[]`), os dois `400`, e `skills` no perfil e nos interessados.

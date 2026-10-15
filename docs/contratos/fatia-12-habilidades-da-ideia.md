# Contrato — Fatia 12: habilidades procuradas na ideia

Objetivo único: quem posta diz do que a ideia precisa (até 5 habilidades do catálogo da [fatia 11](fatia-11-habilidades.md)), e quem lê vê de cara se sabe fazer alguma delas.

Mudou o contrato? Atualiza este arquivo **antes** do código.

## Fora desta fatia (de propósito)

Filtro por habilidade e busca (Descoberta), ordenar o mural por afinidade, avisar quem tem a habilidade, vagas por habilidade.

## Regras

- O mesmo catálogo, o mesmo limite e a mesma limpeza das habilidades do aluno: de 0 a 5, opcional, sem repetição e na ordem do catálogo.
- Editar a ideia troca as habilidades como os outros campos, mesmo com interessados na lista.
- Destaque: para quem está logado, as habilidades da ideia que também estão no perfil de quem vê aparecem destacadas. É só visual: a API não muda por quem vê.

## Banco

`ideas` ganha `skills text[] NOT NULL DEFAULT '{}'`, como `users.skills`.

## Endpoints

### Mudança na fatia 1: `POST /api/ideas` e na fatia 6: `PUT /api/ideas/{id}`

O corpo ganha `skills` (lista). Sem o campo, a ideia fica sem habilidades: o `PUT` troca todos os campos, como já fazia.

```json
{ "title": "…", "description": "…", "course": "cc", "category": "web", "slots": 3, "skills": ["frontend", "design"] }
```

Erros novos (`400 validation_failed`, campo `skills`): `"valor inválido"` (fora do catálogo) e `"escolha até 5"`.

### Toda resposta com ideias

`GET /api/ideas`, `GET /api/ideas/{id}`, `GET /api/me/ideas`, `GET /api/users/{id}` e as respostas do `POST` e do `PUT` ganham, em cada ideia:

```json
{ "skills": ["frontend", "design"] }
```

## Front

- Postar e editar ideia: o grupo de caixas do editar perfil vira o componente `SkillsField`, com o rótulo "Habilidades procuradas" e a dica "Opcional. Escolha até 5.", depois de categoria e vagas.
- Card do mural: uma linha de chips entre a descrição e o rodapé, com até 3 e "+N" para o resto. A linha existe sempre (vazia se a ideia não pede nada), para os cards continuarem com a mesma altura.
- Página da ideia: todos os chips, com o rótulo "Procura".
- Destaque: o chip da habilidade que quem vê também tem fica em `primary-soft` com o ícone `check`, e o leitor de tela ouve "(você tem)".

## Pronto quando

- [ ] `goose up` cria `ideas.skills`.
- [ ] Postar e editar gravam as habilidades; mais de 5 ou valor fora do catálogo responde `400` no campo.
- [ ] O card mostra até 3 chips e "+N"; cards com e sem habilidades têm a mesma altura.
- [ ] Quem tem a habilidade no perfil vê o chip destacado no card e na página.
- [ ] Testes dos handlers cobrindo `skills` no `POST` e no `PUT` (limpa e ordena), os dois `400` e o campo nas listas.

# Contrato — Fatia 18: busca por texto no mural

Objetivo único: quem está logado acha uma ideia por uma palavra do título ou da descrição ("react", "carona", "programação"), somando com os filtros da fatia 17.

Mudou o contrato? Atualiza este arquivo **antes** do código.

## Fora desta fatia (de propósito)

Busca na vitrine (a API aceita, o front não mostra), ranking por relevância, busca do Postgres (`tsvector`), índice (o mural devolve tudo, sem paginação), buscar no nome do autor ou nas habilidades.

## Regras

- A busca acha o texto em qualquer parte do título **ou** da descrição, sem diferenciar maiúsculas nem acentos: "programacao" acha "Programação". É um `ILIKE` com `unaccent` dos dois lados.
- O texto vale como digitado: `%`, `_` e `\` não são curingas. Buscar "50%" acha só quem tem "50%".
- Soma com os filtros: busca **e** status **e** curso **e** categoria **e** habilidade.
- Só quem está logado busca. O visitante não vê o campo, e a API ignora o `q` dele, como os filtros: a prévia continua sendo de 3.
- A busca mora na URL (`/?q=react&course=cc`), junto com os filtros.

## Endpoints

### Mudança na fatia 17: `GET /api/ideas`

Parâmetro novo de query, opcional:

| parâmetro | valor | sem ele |
|---|---|---|
| `q` | texto, até 100 caracteres, sem os espaços das pontas | sem busca |

Os espaços das pontas saem antes de tudo; o que sobra vazio (`?q=`, `?q=%20%20`) é o mesmo que não mandar. A ordem e o formato da resposta não mudam.

Erro (`400 validation_failed`, no formato dos filtros da fatia 17): mais de 100 caracteres (`"deve ter até 100 caracteres"`), ou caractere nulo ou UTF-8 quebrado (`"contém caractere inválido"`). Vale também para o visitante, e soma com os erros dos filtros.

```json
{ "error": "validation_failed", "fields": { "q": "deve ter até 100 caracteres" } }
```

## Banco

Migration que liga a extensão `unaccent` (`CREATE EXTENSION IF NOT EXISTS unaccent`). No Down, ela sai.

## Front

- Mural, só para quem está logado: o campo "Buscar" (`<input type="search" name="q">`, com rótulo) é o primeiro do formulário de filtros da fatia 17. Enter ou "Filtrar" enviam tudo junto.
- O campo abre com o `q` da URL. Com busca ou filtro ativo, "Limpar filtros" aparece e volta para `/`.
- O front repassa o `q` sem os espaços das pontas e corta em 100 caracteres (o `maxLength` do campo já impede mais), para a URL editada à mão não virar `400`.
- Vazio com busca ou filtro: o mesmo `StatePanel` da fatia 17, "Nenhuma ideia com esses filtros", com "Tire um filtro ou" e o link "limpe todos".
- A vitrine não ganha o campo.

## Pronto quando

- [ ] `GET /api/ideas?q=` acha pelo título, pela descrição, sem acento e sem diferenciar maiúscula; soma com os filtros; vazio é sem busca.
- [ ] `%`, `_` e `\` são literais.
- [ ] Mais de 100 caracteres responde `400` em `fields.q`.
- [ ] Visitante com `q` recebe a mesma prévia de sem `q`.
- [ ] Logado vê o campo, busca, combina com filtro, limpa; o link com busca abre com o campo preenchido.
- [ ] Testes do handler: título, descrição, acento, soma com filtro, escape, `400` e visitante.

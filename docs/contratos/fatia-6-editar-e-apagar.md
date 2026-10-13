# Contrato — Fatia 6: editar e apagar a ideia

Objetivo único: o autor corrige a própria ideia ou a apaga de vez, direto da página dela.

Mudou o contrato? Atualiza este arquivo **antes** do código.

## Fora desta fatia (de propósito)

Trocar o status e travar novos interessados (fatia 7), vitrine de concluídas (fatia 8), página "Minhas ideias" (fatia 9), histórico de edições, arquivar em vez de apagar, avisar os interessados de que a ideia mudou ou sumiu.

## Regras

- Só o autor edita ou apaga. Quem não é o autor recebe `403`.
- Editar troca os mesmos campos do postar, com a mesma validação da [fatia 1](fatia-1-mural.md#regras-de-validação). Status, autor e data de postagem não mudam por aqui.
- Apagar é de vez: a ideia some do banco e a lista de interessados vai junto (`interests` já tem `ON DELETE CASCADE`). Não dá para desfazer.
- Vagas menores que o número de interessados é permitido: as vagas continuam só informativas ([fatia 5](fatia-5-quero-participar.md)).

## Banco

Sem migration.

## Endpoints

Erros comuns aos dois:

- `401` — sem sessão válida: `{ "error": "unauthenticated" }`.
- `403` — quem chama não é o autor: `{ "error": "not_author" }`.
- `404` — a ideia não existe, ou o `id` não é inteiro positivo: `{ "error": "not_found" }`.
- `500` — `{ "error": "internal" }`.

### `PUT /api/ideas/{id}` — edita a ideia

Requisição: o mesmo corpo do `POST /api/ideas`, com todos os campos (troca a ideia inteira, não só o que mudou).

```json
{
  "title": "App de carona para o campus",
  "description": "Quero montar um app simples para juntar quem mora perto...",
  "course": "cc",
  "category": "mobile",
  "slots": 4
}
```

Resposta `200 OK`: a ideia atualizada, no mesmo formato do `GET /api/ideas/{id}` mas **sem** `interests` (quem quer a lista pede a página de novo).

Erros, além dos comuns: `400 validation_failed` com `fields`, `400 invalid_json` e `413 body_too_large`, iguais aos do `POST`. A sessão e o autor são conferidos antes do corpo: quem não é o autor recebe `403` mesmo com corpo inválido.

### `DELETE /api/ideas/{id}` — apaga a ideia

Sem corpo. Responde `204 No Content`.

## Front

- Página da ideia, só para o autor: painel "Sua ideia" acima de "Interessados", com "Editar ideia" (`secondary`) e "Apagar ideia" (`danger`).
- "Apagar ideia" pede confirmação na caixa nativa do navegador: "Apagar esta ideia? Os interessados saem da lista e não dá para desfazer." Confirmado, apaga e vai para o mural. Erro: "Não foi possível apagar. Tente de novo." embaixo do botão. Sessão expirada (`401`) vai para `/login`.
- `/ideias/<id>/editar`: o formulário do postar já preenchido, com o título "Editar ideia" e o botão "Salvar alterações". Os erros por campo funcionam como no postar. Depois de salvar, vai para a página da ideia.
- Quem abre `/ideias/<id>/editar` sem ser o autor vai para a página da ideia; visitante vai para `/login`; logado sem curso vai para `/cadastro`; ideia inexistente mostra "Ideia não encontrada".

## Pronto quando

- [ ] O autor edita a ideia e vê a mudança na página dela; campo inválido mostra o erro no campo.
- [ ] O autor apaga a ideia, confirma e volta ao mural sem ela.
- [ ] Quem não é o autor não vê o painel e a API responde `403`.
- [ ] Testes dos handlers cobrindo `PUT` e `DELETE`: sucesso, validação, `401`, `403` e `404`.

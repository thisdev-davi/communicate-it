# Contrato — Fatia 7: status da ideia e trava de interessados

Objetivo único: o autor diz em que pé está a ideia (Aberta, Em andamento, Concluída), e com isso decide quando ela para de receber novos interessados.

Mudou o contrato? Atualiza este arquivo **antes** do código.

## Fora desta fatia (de propósito)

Vitrine de concluídas e tirar as concluídas do mural (fatia 8), filtro por status (Descoberta), avisar os interessados da troca de status, trava separada do status, travar sozinho quando os interessados chegam ao número de vagas.

## Regras

- Só o autor troca o status, e troca livremente entre os três: dá para reabrir uma concluída.
- **A trava vem do status:** só ideia `open` recebe novos interessados. `in_progress` e `done` travam.
- Travar não tira ninguém da lista: quem já estava continua, e o autor continua vendo e chamando no Discord.
- Desistir (`DELETE /interest`) continua aceito em qualquer status, mas a tela não oferece: quem desiste de uma ideia travada não consegue voltar.
- `done_at` guarda quando a ideia foi concluída: é preenchido ao entrar em `done` e volta a `null` ao sair. Marcar `done` de novo numa ideia já concluída mantém a data.

## Banco

Migration `00005`: coluna nova em `ideas`.

| coluna | tipo | regra |
|---|---|---|
| done_at | timestamptz | nulo; `CHECK ((status = 'done') = (done_at IS NOT NULL))` |

O `CHECK` garante no banco que só ideia concluída tem data de conclusão, para qualquer escritor. Nenhuma ideia está concluída antes desta fatia, então não há dado antigo para preencher.

## Endpoints

### `PUT /api/ideas/{id}/status` — troca o status

Requisição:

```json
{ "status": "in_progress" }
```

Valores: `open`, `in_progress`, `done`. Passa por trim antes de validar. Responde `204 No Content`. Repetir o mesmo status não muda nada.

Erros:

- `400` — status faltando ou fora da lista: `{ "error": "validation_failed", "fields": { "status": "valor inválido" } }` (ou `"obrigatório"`).
- `400` — JSON malformado ou com tipo errado: `{ "error": "invalid_json" }`.
- `401` — sem sessão válida: `{ "error": "unauthenticated" }`.
- `403` — quem chama não é o autor: `{ "error": "not_author" }`.
- `404` — a ideia não existe, ou o `id` não é inteiro positivo: `{ "error": "not_found" }`.
- `413` — corpo acima de 64 KB: `{ "error": "body_too_large" }`.
- `500` — `{ "error": "internal" }`.

### Mudança na fatia 5: `PUT /api/ideas/{id}/interest`

Ideia que não está `open` responde `409 { "error": "closed" }`. A ordem das checagens: `404` (não existe), `409 own_idea` (é o autor), `409 closed`.

### Mudança nas respostas de ideia

Toda ideia (`GET /api/ideas`, `GET /api/ideas/{id}`, `POST` e `PUT`) ganha `done_at`: a data em que foi concluída, ou `null`.

```json
{ "status": "done", "done_at": "2026-10-20T14:00:00Z" }
```

## Front

- Painel "Sua ideia" (só o autor): o grupo "Status" com três botões (Aberta, Em andamento, Concluída), o atual marcado com `aria-pressed="true"`. O clique já salva e pede a página de novo ao servidor (`router.refresh()`). Embaixo: "Só ideias abertas recebem novos interessados. Concluídas vão para a vitrine." Erro: "Não foi possível trocar o status. Tente de novo." Sessão expirada vai para `/login`.
- Página da ideia travada (`in_progress` ou `done`): o "Quero participar" some para todos. Quem está na lista continua lendo "Você está na lista. O autor vai te chamar no Discord."; quem não está lê "Esta ideia não está recebendo novos interessados."
- Se o "Quero participar" receber `409` (a ideia travou enquanto a página estava aberta), a página é pedida de novo e passa a mostrar o estado travado.

## Pronto quando

- [ ] `goose up` cria `done_at` com o `CHECK`.
- [ ] O autor troca o status pelos três botões e o selo do card muda.
- [ ] Em ideia em andamento ou concluída, outro aluno não vê o "Quero participar" e a API responde `409 closed`.
- [ ] Concluir preenche `done_at`; reabrir limpa.
- [ ] Testes dos handlers cobrindo o `PUT /status` (sucesso, validação, `401`, `403`, `404`) e o `409 closed`.

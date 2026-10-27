# Comunica FAESA

Plataforma para alunos de TI da FAESA (Ciência da Computação, Engenharia e ADS) acharem parceiros de projeto e terem mais oportunidades de botar a mão na massa juntos.

- **Mural de ideias:** o aluno posta uma ideia de projeto e encontra gente para participar.
- **Eventos:** a comunidade organiza e confirma presença em encontros, dias de trabalho e hackathons.

A conversa dos grupos acontece no Discord da comunidade; a plataforma não tem chat, só aponta para lá.

## Status

**MVP concluído** em 19 de outubro de 2026, construído em fatias verticais (tela → API → banco). A próxima fase sai da fila do [IDEIA](docs/IDEIA.md).

- [x] Fatia 1, back: postar e listar ideias (`POST` / `GET /api/ideas`)
- [x] Fatia 1, front: mural e formulário de postar ideia
- [x] Fatia 2: login com Discord (só membros do servidor da comunidade)
- [x] Fatia 3: escolha de curso no primeiro login e prévia do mural para visitante
- [x] Fatia 4: página da ideia (`GET /api/ideas/{id}`), aberta pelo card do mural
- [x] Fatia 5: "Quero participar" sem aprovação; o autor vê os interessados e chama no Discord
- [x] Fatia 6: o autor edita e apaga a própria ideia
- [x] Fatia 7: o autor troca o status da ideia; só ideia aberta recebe novos interessados
- [x] Fatia 8: vitrine de projetos concluídos (`/concluidas`) e navegação no cabeçalho
- [x] Fatia 9: "Minhas ideias", com todas as ideias do aluno em qualquer status
- [x] Fatia 10: perfil do aluno (`/alunos/<id>`), com as ideias que postou e as de que participa
- [x] Fatia 11: habilidades no perfil (até 5, de um catálogo fixo)
- [x] Fatia 12: habilidades procuradas na ideia, com destaque das que você tem
- [x] Fatia 13: agenda de eventos (`/eventos`) e criar evento
- [x] Fatia 14: página do evento, "Vou participar" e lista de quem vai
- [x] Fatia 15: cargo de moderação lido do Discord; o moderador apaga qualquer ideia
- [x] Fatia 16: o criador e o moderador editam e apagam o evento
- [x] Fatia 17: filtros do mural (status, curso, categoria e habilidade), para quem está logado
- [x] Fatia 18: busca por texto no título e na descrição, sem diferenciar maiúscula nem acento
- [x] Fatia 19: o grupo fechou (ideia Em andamento), o bot do Discord cria a call e o cargo do grupo

Depois do fechamento, uma revisão do código virou correções sem funcionalidade nova: cookies `__Host-` e headers de segurança (PR #37), regras de participação e curso obrigatório na API (PR #38). A habilidade "Maratona de Programação" entrou no catálogo (PR #39).

Comentários nas ideias saíram do MVP e foram para a fila ([IDEIA](docs/IDEIA.md)).

Cada fatia tem o contrato em [`docs/contratos/`](docs/contratos/); as fases de eventos (13 a 16, concluída) e de descoberta (17 e 18) estão detalhadas no [PRD](docs/PRD.md).

## Stack

| Parte | Tecnologia |
|---|---|
| API | Go (`net/http`), REST/JSON |
| Banco | PostgreSQL, sqlc + pgx, migrations com goose |
| Front | Next.js (React) |
| Login | Discord OAuth |
| Deploy | Vercel (front), Render (API em Docker) e Neon (Postgres), no plano grátis |

## Rodando localmente

Pré-requisitos: Go 1.27+, Node.js 20.9+, Docker com Compose e [goose](https://github.com/pressly/goose).

```sh
cp .env.example .env              # troque a senha e preencha as DISCORD_* (abaixo)
set -a; . ./.env; set +a          # exporta as variáveis no shell

docker compose up -d              # Postgres em localhost:5450
goose -dir backend/db/migrations postgres "$DATABASE_URL" up
goose -dir backend/db/migrations postgres "$TEST_DATABASE_URL" up
docker compose exec -T db psql -U comunica -d comunica < backend/db/seed/dev.sql   # autor, ideia, evento e sessão de teste fictícios

cd backend
go test ./...                     # testes
go run ./cmd/api                  # API em http://localhost:8090

# em outro terminal, na raiz
cd frontend && npm install && npm run dev   # mural em http://localhost:3000
```

Teste rápido: `curl localhost:8090/api/ideas` lista o mural (sem login, só as 3 ideias mais recentes). Postar exige login: entre por http://localhost:3000/login.

### App do Discord

O login usa OAuth do Discord e só deixa entrar quem está no servidor da comunidade.

1. No [Discord Developer Portal](https://discord.com/developers/applications), crie uma aplicação. Em **OAuth2**, adicione o redirect `http://localhost:3000/api/auth/discord/callback` e copie o **Client ID** e o **Client Secret** para `DISCORD_CLIENT_ID` e `DISCORD_CLIENT_SECRET` no `.env`.
2. No Discord, ative o **Modo desenvolvedor** (Configurações → Avançado), clique com o botão direito no servidor da comunidade → **Copiar ID** e cole em `DISCORD_GUILD_ID`.
3. Crie um convite sem expiração do servidor e cole em `DISCORD_INVITE_URL`.
4. Opcional, para a moderação: em **Configurações do servidor → Cargos**, clique com o botão direito nos cargos Admin e Moderação → **Copiar ID** e cole os dois em `DISCORD_MOD_ROLE_IDS`, separados por vírgula. Quem tem um desses cargos vira moderador no próximo login (ver abaixo).

5. Opcional, para a call do grupo ([fatia 19](docs/contratos/fatia-19-call-no-discord.md)): no Developer Portal, em **Bot**, clique em **Reset Token** e cole o token em `DISCORD_BOT_TOKEN`. Ponha o bot no servidor abrindo, como admin, `https://discord.com/oauth2/authorize?client_id=<DISCORD_CLIENT_ID>&scope=bot&permissions=271649808` (Gerenciar Cargos, Gerenciar Canais, Ver Canais, Conectar, Falar, Enviar Mensagens e Ler Histórico). No servidor, crie uma categoria para os canais dos grupos (ex.: "Projetos"), copie o ID dela e cole em `DISCORD_CALLS_CATEGORY_ID`. Sem o token, a API sobe sem a call.

#### Cargo de moderação

O cargo mora no Discord: quem dá e tira são os admins do servidor. A API relê os cargos a cada login e grava `users.is_moderator`. Tirar o cargo só vale no próximo login da pessoa, até 30 dias depois (a duração da sessão). O mesmo vale para quem é removido ou banido do servidor: a API só confere se a pessoa é membro no login, então ela continua com acesso até a sessão expirar. Nos dois casos, para valer na hora, apague as sessões dela, o que força um novo login (e quem saiu do servidor não consegue entrar de novo):

```sh
# local; em produção, o mesmo DELETE no SQL Editor do Neon
docker compose exec db psql -U comunica -d comunica -c "DELETE FROM sessions WHERE user_id = <id do usuário>;"
```

O secret nunca vai para o repositório: ele vive só no `.env`.

## Deploy

Tudo no plano grátis, na costa leste dos EUA: front na Vercel, API no Render (Docker) e banco no Neon. O navegador só fala com https://communicate-it.vercel.app. O Next repassa `/api/*` para a API (`frontend/next.config.ts`), então o cookie da sessão e o callback do Discord ficam no domínio do front.

Todo push na `main` (menos os só de `docs/` e `.md`) roda o workflow `.github/workflows/deploy.yml`: testes da API e checagens do front e, se passarem, o `goose up` no Neon e o deploy hook do Render. Assim a migration sempre roda antes da API nova. O mesmo workflow roda as checagens em todo PR. A Vercel publica o front sozinha a cada push na `main`. Os previews de PR mostram as telas, mas o login só funciona no domínio de produção. Para refazer o deploy da API sem commit novo: aba **Actions** → **CI e deploy** → **Run workflow**, ou `gh workflow run deploy.yml`.

### Primeira vez

1. **Neon:** crie o projeto com Postgres 17 na região AWS US East 1 (N. Virginia). Em **Connect**, desligue o *connection pooling* (a API usa os prepared statements do pgx), copie a string e troque o que vem depois do `?` por `sslmode=verify-full`.
2. **Discord:** no Developer Portal, crie uma aplicação só para produção, a "Communicate IT". A de dev continua no `.env` local. Em **OAuth2**, adicione o redirect `https://communicate-it.vercel.app/api/auth/discord/callback` e copie o Client ID e o Client Secret. No servidor, crie um convite que nunca expira e sem limite de usos.
3. **Render:** **New → Web Service** com este repositório, linguagem Docker, Root Directory `backend`, região Virginia, instância Free e nome `communicate-it-api`. Variáveis: `DATABASE_URL` (a string do Neon), `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URL` (o redirect do passo 2), `DISCORD_GUILD_ID` e `DISCORD_MOD_ROLE_IDS`. A porta, o Render passa sozinho em `PORT`. Depois de criado, em **Settings**: **Auto-Deploy** em **Off** (quem faz o deploy é o workflow, depois da migration). Copie também o **Deploy Hook**.
4. **Vercel:** **Add New → Project** com este repositório, Root Directory `frontend` e nome `communicate-it`. Variáveis, em todos os ambientes: `API_URL=https://communicate-it-api.onrender.com` e `DISCORD_INVITE_URL` (o convite do passo 2). O rewrite lê o `API_URL` no build, então ela precisa existir antes do primeiro deploy.
5. **GitHub:** em **Settings → Environments → production** (liberado só para a `main`), crie os secrets `PROD_DATABASE_URL` (a string do Neon) e `RENDER_DEPLOY_HOOK_URL` (quem tem essa URL dispara deploy, então ela é secreta). Depois, rode o **Run workflow**: ele cria as tabelas e sobe a API.
6. **Pinger:** no [cron-job.org](https://cron-job.org), um GET em `https://communicate-it.vercel.app/login` a cada 10 minutos. O Render free dorme depois de 15 minutos sem acesso, e quem chega nessa hora espera cerca de 1 minuto. A página chama `GET /api/me` sem cookie: isso acorda a API, que responde 401 sem consultar o banco, e o Neon continua dormindo. Uma API acordada o mês todo gasta cerca de 744 h das 750 h grátis do Render, então ela precisa ser o único serviço free da conta.

### No dia a dia

- Logs da API: painel do Render → **Logs**. Banco: **SQL Editor** do Neon.
- Mudou uma variável no Render: ele refaz o deploy ao salvar. Mudou na Vercel: **Deployments → Redeploy**, porque o `API_URL` só vale num build novo.
- Login falhando com 429 nos logs da API: o Discord bloqueou o IP compartilhado do Render. O plano B é subir o mesmo `backend/Dockerfile` em outro host grátis (ex.: Koyeb) e trocar o `API_URL` na Vercel.
- O seed nunca roda em produção: lá só entram dados reais, criados pelo próprio site.

## Estrutura

```
backend/
  cmd/api/           ponto de entrada da API
  internal/<domínio> handler e queries por domínio (auth, ideas, events)
  db/migrations/     migrations do goose
  db/queries/        SQL lido pelo sqlc
  db/seed/           dados fictícios, só para uso local
frontend/
  app/               páginas e componentes do Next.js (App Router)
docs/
  PRD.md             escopo do MVP e regras de negócio
  IDEIA.md           visão e fases futuras
  contratos/         contrato de API de cada fatia
  DESIGN.md          regras de interface: visual, telas, texto e acessibilidade
```

## Como o projeto é tocado

Cada funcionalidade vira uma issue com a especificação, uma branch e um pull request pequeno, com no máximo 500 linhas de lógica. Front e back codam contra o contrato da fatia em `docs/contratos/`. As regras completas estão no [CLAUDE.md](CLAUDE.md).

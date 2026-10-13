# Design do front — Comunica FAESA

Regras de interface do front: visual, padrões de tela, texto e acessibilidade. **É a fonte da verdade** para qualquer tela, componente ou texto novo. Na dúvida entre este arquivo e outra referência, vale este arquivo.

- **Valores** (cores, espaçamentos, raios, sombra, fonte) moram em `frontend/app/globals.css`, como variáveis CSS com os nomes dos tokens. Este documento cita os tokens pelo nome e não repete os valores.
- **Referência visual:** o artefato "Comunica FAESA" (design system no claude.ai, privado do Davi) tem os previews dos componentes e as Telas. Ele inspira, mas não manda. O que diverge dele está no fim deste arquivo.
- **Marca** (nome, símbolo, logo da FAESA) fica no artefato. Aqui, só o que afeta o código: o nome é sempre "Comunica FAESA", e o logo vem do componente `Logo`.

## Visual

### Cor

- **Superfícies:**
  - a página é `surface`;
  - cards, menus e cabeçalho são `surface-raised`;
  - campos usam `field`, que no escuro fica mais fundo que o card;
  - áreas rebaixadas e o fundo de desabilitado usam `surface-sunken`.
- **Texto:** principal em `ink`, metadados e apoio em `ink-muted`.
- **`primary`:** ação principal da tela (um botão `primary` por vez), links e foco de identidade. O texto sobre ele é `on-primary`.
- **`accent`:** o laranja escurecido, reservado para o convite a participar. É no máximo um por tela ou card, e nunca dois laranjas lado a lado. O texto sobre ele é `on-accent`, nunca branco fixo. A versão `accent-soft` é o fundo de selo de destaque ("Você participa"), e a borda `accent` marca o card de quem participa.
- **`faesa-orange` e `faesa-amber`:** cores puras da instituição, só para grafismo (o losango, o logo). Não servem para texto nem para fundo de botão: com texto branco ficam abaixo de 4.5:1.
- **Status da ideia:** `status-open`, `status-progress` e `status-done`, cada um sobre o seu `-soft`, sempre com a palavra junto. A cor nunca carrega a informação sozinha.
- **Erro:** `danger` sobre `danger-soft`. O mesmo par pinta o botão `danger`, só para ação que destrói ("Apagar ideia").
- **Bordas:** `line` em divisórias e cards; `line-strong` em controles (campo, botão secundário) e no hover de card clicável.

### Tema claro e escuro

- Cada cor de `globals.css` é `light-dark(claro, escuro)`, e o `color-scheme` da página escolhe qual vale. Cor nova entra do mesmo jeito, com as duas versões; nunca crie cor fixa que só funciona em um tema.
- Sem escolha salva, o tema segue o sistema. O botão de sol/lua no cabeçalho (`theme-toggle.tsx`) grava `data-theme` no `<html>` e a escolha no `localStorage` (chave `tema`). O script do `layout.tsx` aplica antes da pintura, então a página não pisca.
- O escuro usa superfícies azul-marinho profundas, não preto.

### Tipografia

- Uma família só, `--font-sans` (Plus Jakarta Sans via `next/font`).

| uso | tamanho / peso | onde |
|---|---|---|
| título de página | 32px / 800 (28px no celular) | `.display` do mural |
| título da ideia | 24px / 700 | `IdeaCard` com `full` |
| título de página em card | 24px / 700 | "Postar ideia" |
| título de seção | 18px / 700 | "Sua ideia", "Interessados", login, cadastro |
| título no card | 17px / 700 | `IdeaCard` |
| texto corrido | 15px / 400 | descrição na página da ideia, parágrafos |
| resumo e metadados | 13px (12px na linha de ícones do card) | descrição no card, rodapés |
| etiqueta (eyebrow) | 11px / 700, espaçada | curso · categoria no card |
| botão | 13px / 700 (12px no `sm`) | `Button` |

- **Caixa alta só em botões e na etiqueta do card.** Títulos de página e de seção ficam em caixa normal: decisão do Davi, que diverge do artefato. Escreva o texto em caixa normal no código, porque a caixa alta vem do CSS e assim o leitor de tela não soletra.
- Títulos de ideias ficam como o autor escreveu.

### Espaço, raio e sombra

- Escala de 4px: `space-1` a `space-8` (4 a 64).
- Cards têm padding `space-5`, gap interno `space-3`, e `space-6` entre cards na grade.
- Raios: `radius-sm` em botões, campos e selos; `radius-md` em cards e avisos; `radius-lg` no cartão de login; `radius-full` em avatares.
- Sombra: `shadow-card` em todo card (classe global `card`). Só a cor da sombra muda com o tema.

### Grafismo e ícones

- **Losango:** um quadrado girado 45°, usado pequeno, como pontuação. Aparece na marca dos selos de status e no logo. Não encha telas com ele nem ponha texto dentro.
- **Ícones:** Lucide 0.460.0, copiado como SVG em `components/Icon.tsx`, com traço de 1.5. Sem pacote.
  - Para ícone novo, baixe o SVG dessa versão, copie os `d` e converta `<circle>`/`<rect>` em path.
  - Tamanhos: 16px em botões e 14px em selos e metadados.
- **Ícone sempre com texto ao lado.** Botão só de ícone (o tema) leva `aria-label`. Ícone é sempre `aria-hidden`.
- **Ícones em uso:**

  | ícone | onde |
  |---|---|
  | `log-in` | Entrar |
  | `log-out` | Sair |
  | `lightbulb` | Postar ideia |
  | `users` | vagas |
  | `hand` | interessados |
  | `calendar` | data |
  | `circle-check` | sucesso, "Você participa", "concluída em" |
  | `circle-alert` | erro |
  | `sun` / `moon` | tema |

- A marca do Discord (simple-icons) só aparece em botões que levam ao Discord: "Entrar com Discord" e "Chamar no Discord".
- Sem emoji no lugar de ícone.

## Telas e UX

### Layout

- **Coluna da página:** conteúdo com no máximo 1040px, centralizado, com recuo lateral `space-6` (`space-4` no celular). Páginas de leitura e formulário (ideia, postar) usam a coluna mais estreita, de 760px.
- **Cabeçalho:** a barra vai de ponta a ponta, mas o conteúdo dela (`.bar`) segue a coluna de 1040px. Logo, título da página e primeiro card começam na mesma linha vertical, e a última ação termina junto com a última coluna da grade.
- **Navegação:** links no cabeçalho, colados no logo ("Mural", "Concluídos"), com `aria-current="page"` na página atual, que ganha cor `primary` e fundo `primary-soft` (nunca só a cor). Barra no topo, sem menu lateral nem hambúrguer: no celular (até 600px), os links descem para uma segunda linha da barra.
- **Topo do mural:** título e texto de apoio à esquerda; a ação da página ("Postar ideia") à direita, alinhada pela base. No celular, a ação desce.
- **Voltar:** páginas internas começam com o link "Voltar ao mural". A página de editar volta para a ideia ("Voltar à ideia").

### Cards do mural

- Todos têm **a mesma altura**:
  - etiqueta em 1 linha;
  - título em até 2 linhas;
  - descrição em 3 linhas;
  - o que passar corta com "…", e o texto curto deixa o espaço reservado (`min-height`);
  - o rodapé fica sempre embaixo (`margin-top: auto`), e a grade estica os cards.
- A etiqueta usa a sigla do curso (`COURSE_SHORT`: CC, ENG, ADS). A página da ideia mostra o nome inteiro.
- Rodapé: foto e nome do autor (cortado com "…") e, embaixo, a linha de ícones (vagas, interessados, data). Na ideia concluída, a data é a da conclusão, escrita por extenso ("concluída em DD/MM", com `circle-check`) para não ser confundida com a postagem.
- **O card não tem ação.** O título é um link esticado que torna o card inteiro clicável e leva à página da ideia, onde ficam as ações. Não aninhe botões ou links dentro do card.
- Quem já participa vê a borda `accent` e o selo "Você participa" na linha do autor.

### Páginas e fluxos

- **Mural (`/`):**
  - só ideias abertas e em andamento; as concluídas vão para a vitrine;
  - o visitante vê a prévia de 3 ideias e o convite para entrar;
  - quem está logado vê tudo e o botão "Postar ideia";
  - logado sem curso vai para `/cadastro`.
- **Concluídos (`/concluidas`):** a vitrine, com a mesma grade do mural e as concluídas mais recentes primeiro. O visitante vê a prévia de 3 e o convite para entrar. É onde o build in public vai entrar.
- **Página da ideia (`/ideias/<id>`):**
  - o card inteiro (`full`), sem cortes;
  - quem não é autor vê o "Quero participar", que vira "Interessado" (`aria-pressed`), só enquanto a ideia está Aberta;
  - o interessado lê "Você está na lista. O autor vai te chamar no Discord.";
  - na ideia Em andamento ou Concluída, o botão some para todos, e quem não está na lista lê "Esta ideia não está recebendo novos interessados.";
  - o autor vê o painel "Sua ideia": o grupo "Status" com três botões `sm` (o atual `primary` com `aria-pressed`, os outros `secondary`; o clique já salva) e a regra "Só ideias abertas recebem novos interessados.", depois "Editar ideia" (`secondary`) e "Apagar ideia" (`danger`), e embaixo a seção "Interessados (N)" com "Chamar no Discord", que abre o perfil e copia a primeira mensagem;
  - "Apagar ideia" confirma na caixa nativa do navegador (`confirm()`), que já é acessível, e depois volta ao mural;
  - ideia inexistente mostra "Ideia não encontrada".
- **Postar (`/ideias/nova`):** só para quem está logado e tem curso. Depois do envio, vai para a página da ideia nova.
- **Editar (`/ideias/<id>/editar`):** o mesmo formulário do postar, já preenchido, com "Editar ideia" e "Salvar alterações". Só o autor; quem não é o autor vai para a página da ideia. Depois de salvar, volta para a ideia.
- **A conversa acontece no Discord.** A interface aponta para lá (perfil, convite do servidor) e não constrói chat.

### Estados

- **Carregando:**
  - o conteúdo dinâmico fica dentro de `<Suspense>` com um substituto do mesmo tamanho (esqueleto de cards no mural) ou um texto curto com `role="status"`;
  - o que não depende da requisição sai no shell estático.
- **Vazio:** `StatePanel` com título e uma frase que convida a agir ("Nenhuma ideia ainda. Que tal postar a primeira?").
- **Erro de carregamento:** `StatePanel tone="error"`, que diz o que fazer ("Atualize a página em alguns instantes") e nunca mostra detalhe técnico.
- **Erro de ação:** a mensagem fica perto do que falhou (`Notice` no topo do formulário, texto embaixo do botão) e diz o que fazer.
- **Ação em andamento:** o controle fica desabilitado e o texto muda ("Enviando…", "Salvando…", "Apagando…"). Depois de gravar, o front pede a página de novo ao servidor (`router.refresh()` ou navegação), em vez de inventar o estado no cliente.

### Formulários

- Os erros mostrados são os do `400` da API (`fields`), traduzidos para "o que fazer" ("Use de 3 a 120 caracteres.").
- O erro fica no campo: borda `danger`, `aria-invalid` e a dica trocada pela mensagem (ligada por `aria-describedby`).
- No envio com erro, o foco vai para o primeiro campo inválido.
- Durante o envio, o `<fieldset disabled>` trava tudo.

### Texto da interface

- Fale com o aluno por "você", em português do dia a dia e frases curtas.
- Botão começa com verbo: "Postar ideia", "Quero participar", "Chamar no Discord".
- Status são sempre "Aberta", "Em andamento" e "Concluída".
- Sem emoji e sem ponto de exclamação.
- Números em algarismos: "3 vagas", "2 interessados".
- Estado vazio convida a agir. Erro diz o que fazer, não o que quebrou.

## Checklist de acessibilidade (antes do PR)

- [ ] Todo elemento clicável mostra o foco de teclado: 2px sólido em `focus`, afastado 2px. Nunca `outline: none` sem outro anel no lugar (o card desenha o anel no `::after` do link).
- [ ] Texto sobre fundo com contraste de 4.5:1 ou mais nos dois temas; use só os pares do design system (`ink`/`ink-muted` sobre `surface-*`, `on-primary` sobre `primary`, `on-accent` sobre `accent`).
- [ ] A informação não depende só da cor: status com a palavra, selo com texto.
- [ ] Alternáveis usam `aria-pressed` e mudam texto e cor juntos.
- [ ] Botão só de ícone tem `aria-label`; ícone ao lado de texto é `aria-hidden`.
- [ ] Botões pequenos e abas sobem para 44px de altura em tela de toque (`@media (pointer: coarse)`).
- [ ] Aviso que aparece depois de uma ação usa região viva: `role="alert"` para erro e `role="status"` para sucesso. A região já existe no DOM antes da mensagem, quando for `status`.
- [ ] Cada página tem um `<main id="conteudo">` (alvo do "Pular para o conteúdo") e um `h1`; os títulos seguem a ordem.
- [ ] Link para fora (Discord) abre em nova aba com `rel="noopener noreferrer"` e avisa no texto acessível ("abre em nova aba").
- [ ] Testado nos dois temas e com a página estreita (até 600px).

## Ainda não feito

Previsto no artefato, mas sem código ainda. Não é regra até ser implementado.

- Rascunho do formulário de postar em `sessionStorage`, para nada se perder se o aluno sair com texto digitado.
- @ do Discord do autor no card, só para quem está logado.
- Modal "Ideia postada" (hoje o envio leva direto à página da ideia).
- Habilidades (`SkillChip`), abas (`Tabs`) para Comentários/Interessados e `EventCard`: entram com as fatias que precisarem deles.

## Onde o artefato diverge (para atualizar no chat do design system)

- Caixa alta: o artefato pede em `display` e `title-2`. **No front, títulos ficam em caixa normal.**
- Tema: o artefato diz "não há botão de troca" e usa `@media (prefers-color-scheme)`. **O front tem o toggle e usa `light-dark()` + `data-theme`.**
- Ícone de "Postar ideia": o artefato usa `plus`. **O front usa `lightbulb`.**
- Marca do Discord: o artefato limita ao "Entrar com Discord". **Também aparece no "Chamar no Discord".**
- Postar ideia: o artefato prevê o modal "Ideia postada" na volta ao mural. **O front vai para a página da ideia nova.**
- `IdeaCard`: o artefato tem o "Quero participar" no card e a altura livre. **No front, o card não tem ação, tem altura fixa e usa a sigla do curso.**
- Título da página da ideia: o artefato tem `title-1` com 28px. **O front usa 24px.**

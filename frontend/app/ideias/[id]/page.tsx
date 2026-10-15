import { redirect, unstable_rethrow } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "../../components/Avatar";
import { CallOnDiscord } from "../../components/CallOnDiscord";
import { IdeaCard } from "../../components/IdeaCard";
import { InterestButton } from "../../components/InterestButton";
import { StatePanel } from "../../components/StatePanel";
import { type Idea, type Interest } from "../../ideas";
import { getMe } from "../../me";
import { AuthorPanel } from "./author-panel";
import { getIdea } from "./get-idea";
import styles from "./ideia.module.css";

// Contrato da fatia 4 (docs/contratos/fatia-4-pagina-da-ideia.md): só para quem está logado e já tem curso.
// Roda no servidor e chama o Go direto (getIdea), repassando o cookie do navegador.
async function IdeaDetail({ params }: { params: PageProps<"/ideias/[id]">["params"] }) {
  const me = await getMe();
  if (!me) redirect("/login");
  if (!me.course) redirect("/cadastro");

  const { id } = await params;
  let idea: Idea;
  try {
    idea = await getIdea(id);
  } catch (err) {
    unstable_rethrow(err); // deixa passar o notFound, o redirect e os erros internos do Next
    console.error("buscar ideia:", err);
    return (
      <StatePanel tone="error" title="Não foi possível carregar a ideia">
        Pode ser uma instabilidade rápida. Atualize a página em alguns instantes.
      </StatePanel>
    );
  }
  const mine = me.id === idea.author.id;
  const open = idea.status === "open";
  return (
    <>
      <IdeaCard
        idea={idea}
        full
        // Visitante nem chega aqui; o autor não participa da própria ideia, e só ideia aberta recebe interessados
        // (a API também recusa as duas, 409).
        action={!mine && open && <InterestButton ideaId={idea.id} interested={idea.interested} />}
      />
      {idea.interested && <p className={styles.hint}>Você está na lista. O autor vai te chamar no Discord.</p>}
      {!mine && !open && !idea.interested && <p className={styles.hint}>Esta ideia não está recebendo novos interessados.</p>}
      {mine && <AuthorPanel ideaId={idea.id} status={idea.status} />}
      {idea.interests && <Interested people={idea.interests} ideaTitle={idea.title} />}
    </>
  );
}

// Só o autor recebe a lista da API (fatia 5): quem marcou "Quero participar", em ordem de chegada.
function Interested({ people, ideaTitle }: { people: Interest[]; ideaTitle: string }) {
  return (
    <section className={`card ${styles.panel}`} aria-labelledby="interessados">
      <h2 id="interessados" className={styles.section}>
        Interessados ({people.length})
      </h2>
      {people.length === 0 ? (
        <p className={styles.empty}>Ninguém se interessou ainda. Quando alguém clicar em “Quero participar”, aparece aqui.</p>
      ) : (
        <ul className={styles.list}>
          {people.map((p) => (
            <li key={p.id} className={styles.person}>
              <Avatar name={p.name} src={p.avatar_url} />
              <span className={styles.name}>{p.name}</span>
              {/* Sem discord_id só os usuários fictícios do seed local: não há perfil para abrir. */}
              {p.discord_id && <CallOnDiscord discordId={p.discord_id} name={p.name} ideaTitle={ideaTitle} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// O id da URL só existe na requisição: o que depende dele espera dentro do Suspense, e o resto sai no shell estático.
export default function IdeaPage({ params }: PageProps<"/ideias/[id]">) {
  return (
    <main id="conteudo" className={styles.page}>
      <Link href="/" className={styles.back}>
        Voltar ao mural
      </Link>
      <Suspense
        fallback={
          <p className={styles.loading} role="status">
            Carregando ideia…
          </p>
        }
      >
        <IdeaDetail params={params} />
      </Suspense>
    </main>
  );
}

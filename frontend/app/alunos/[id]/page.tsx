import { cookies } from "next/headers";
import { notFound, redirect, unstable_rethrow } from "next/navigation";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Avatar } from "../../components/Avatar";
import { ButtonLink } from "../../components/Button";
import { CallOnDiscord } from "../../components/CallOnDiscord";
import { IdeaCard } from "../../components/IdeaCard";
import { SkillChips } from "../../components/SkillChips";
import { StatePanel } from "../../components/StatePanel";
import { API_URL, COURSES, type Idea } from "../../ideas";
import { getMe } from "../../me";
import mural from "../../mural.module.css";
import styles from "./perfil.module.css";

// Contrato da fatia 10 (docs/contratos/fatia-10-perfil.md).
type Profile = {
  id: number;
  name: string;
  avatar_url: string | null;
  course: string | null; // null enquanto o cadastro está pendente
  discord_id: string | null;
  skills: string[]; // fatia 11, na ordem do catálogo
  ideas: Idea[]; // as que postou
  participating: Idea[]; // as que marcou "Quero participar"
};

// Roda no servidor e chama o Go direto, repassando o cookie do navegador (sem ele a API responde 401).
async function getProfile(id: string): Promise<Profile> {
  const cookie = (await cookies()).toString();
  const res = await fetch(`${API_URL}/api/users/${encodeURIComponent(id)}`, { headers: { cookie } });
  if (res.status === 404) notFound(); // também para id inválido (abc, 0)
  if (res.status === 401) redirect("/login"); // a sessão expirou entre o getMe e aqui
  if (!res.ok) throw new Error(`status ${res.status}`);
  return res.json();
}

// Só para quem está logado e já tem curso, como a página da ideia.
async function ProfileDetail({ params }: { params: PageProps<"/alunos/[id]">["params"] }) {
  const me = await getMe();
  if (!me) redirect("/login");
  if (!me.course) redirect("/cadastro");

  const { id } = await params;
  let p: Profile;
  try {
    p = await getProfile(id);
  } catch (err) {
    unstable_rethrow(err); // deixa passar o notFound, o redirect e os erros internos do Next
    console.error("buscar perfil:", err);
    return (
      <StatePanel tone="error" title="Não foi possível carregar o perfil">
        Pode ser uma instabilidade rápida. Atualize a página em alguns instantes.
      </StatePanel>
    );
  }
  const mine = me.id === p.id;
  return (
    <>
      <header className={`card ${styles.head}`}>
        <Avatar name={p.name} src={p.avatar_url} size="lg" decorative />
        <div className={styles.who}>
          <h1 className={styles.name}>{p.name}</h1>
          {p.course && <p className={styles.course}>{COURSES[p.course] ?? p.course}</p>}
          {p.skills.length > 0 ? (
            <SkillChips skills={p.skills} className={styles.skills} />
          ) : (
            // O botão "Editar perfil" já está ao lado: o convite é só a frase.
            mine && <p className={styles.empty}>Você ainda não adicionou habilidades.</p>
          )}
        </div>
        {/* No próprio perfil, editar; no dos outros, chamar. Sem discord_id só os usuários fictícios do seed local. */}
        {mine ? (
          <ButtonLink href="/perfil/editar" variant="secondary" size="sm">
            Editar perfil
          </ButtonLink>
        ) : (
          p.discord_id && <CallOnDiscord discordId={p.discord_id} name={p.name} />
        )}
      </header>
      <Section
        title="Ideias postadas"
        items={p.ideas}
        empty={
          mine ? (
            <>
              Você ainda não postou ideias. <Link href="/ideias/nova">Postar ideia</Link>
            </>
          ) : (
            "Ainda não postou ideias."
          )
        }
      />
      <Section
        title="Participa de"
        items={p.participating}
        empty={
          mine ? (
            <>
              Você ainda não participa de nenhuma ideia. <Link href="/">Ver o mural</Link>
            </>
          ) : (
            "Ainda não participa de nenhuma ideia."
          )
        }
      />
    </>
  );
}

// Uma lista do perfil na grade do mural; vazia, só uma frase (o título da seção já diz o que falta).
function Section({ title, items, empty }: { title: string; items: Idea[]; empty: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>
        {title} ({items.length})
      </h2>
      {items.length === 0 ? (
        <p className={styles.empty}>{empty}</p>
      ) : (
        <ul className={mural.grid}>
          {items.map((idea) => (
            <li key={idea.id}>
              <IdeaCard idea={idea} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// O id da URL só existe na requisição: o que depende dele espera dentro do Suspense, e o resto sai no shell estático.
export default function ProfilePage({ params }: PageProps<"/alunos/[id]">) {
  return (
    <main id="conteudo" className={mural.page}>
      <Link href="/" className={styles.back}>
        Voltar ao mural
      </Link>
      <Suspense
        fallback={
          <p className={styles.loading} role="status">
            Carregando perfil…
          </p>
        }
      >
        <ProfileDetail params={params} />
      </Suspense>
    </main>
  );
}

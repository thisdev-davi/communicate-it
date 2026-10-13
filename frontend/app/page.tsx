import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { ButtonLink } from "./components/Button";
import { IdeaList, Skeleton } from "./idea-list";
import { getMe } from "./me";
import styles from "./mural.module.css";

const ABOUT = "Ideias de projeto postadas por alunos de TI da FAESA.";

// Visitante ganha o convite para entrar; o "Entrar" do cabeçalho também leva ao login.
async function Lead() {
  if (await getMe()) return <p className={styles.lead}>{ABOUT}</p>;
  return (
    <p className={styles.lead}>
      {ABOUT} <Link href="/login">Entre com o Discord</Link> para ver o mural todo e postar a sua.
    </p>
  );
}

// O formulário mora em /ideias/nova; o mural só leva até ele, e só para quem está logado.
// Logado sem curso ainda não terminou o cadastro: vai para lá antes de usar o mural.
async function PostAction() {
  const me = await getMe();
  if (me && !me.course) redirect("/cadastro");
  return (
    me && (
      <ButtonLink href="/ideias/nova" icon="lightbulb">
        Postar ideia
      </ButtonLink>
    )
  );
}

export default function Home() {
  return (
    <main id="conteudo" className={styles.page}>
      {/* Título e texto à esquerda, "Postar ideia" à direita: as bordas batem com as da grade de cards. */}
      <div className={styles.hero}>
        <div className={styles.intro}>
          <h1 className={styles.display}>Mural de ideias</h1>
          <Suspense fallback={<p className={styles.lead}>{ABOUT}</p>}>
            <Lead />
          </Suspense>
        </div>
        <Suspense fallback={null}>
          <PostAction />
        </Suspense>
      </div>
      <h2 className="sr-only">Ideias</h2>
      <Suspense fallback={<Skeleton />}>
        {/* Concluídas ficam na vitrine (/concluidas): o mural traz só as abertas e em andamento. */}
        <IdeaList
          path="/api/ideas"
          errorTitle="Não foi possível carregar o mural"
          emptyTitle="Nenhuma ideia ainda"
          emptyText="Que tal postar a primeira? Conte o problema e quem você procura."
          invite="para ver o mural todo."
        />
      </Suspense>
    </main>
  );
}

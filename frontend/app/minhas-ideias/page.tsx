import { Suspense } from "react";
import { ButtonLink } from "../components/Button";
import { IdeaList, Skeleton } from "../idea-list";
import styles from "../mural.module.css";

// Minhas ideias (docs/contratos/fatia-9-minhas-ideias.md): todas as ideias de quem está logado, em qualquer status.
// Só lista e leva à página de cada uma, onde fica o painel "Sua ideia". Visitante vai para o login (a API responde 401).
export default function MyIdeasPage() {
  return (
    <main id="conteudo" className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.intro}>
          <h1 className={styles.display}>Minhas ideias</h1>
          <p className={styles.lead}>Todas as ideias que você postou. Abra uma para trocar o status, editar ou apagar.</p>
        </div>
        <ButtonLink href="/ideias/nova" icon="lightbulb">
          Postar ideia
        </ButtonLink>
      </div>
      <h2 className="sr-only">Ideias</h2>
      <Suspense fallback={<Skeleton />}>
        <IdeaList
          path="/api/me/ideas"
          errorTitle="Não foi possível carregar suas ideias"
          emptyTitle="Você ainda não postou nenhuma ideia"
          emptyText="Que tal postar a primeira? Conte o problema e quem você procura."
        />
      </Suspense>
    </main>
  );
}

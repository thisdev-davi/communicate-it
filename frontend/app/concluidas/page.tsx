import { Suspense } from "react";
import { IdeaList, Skeleton } from "../idea-list";
import styles from "../mural.module.css";

// Vitrine de projetos concluídos (docs/contratos/fatia-8-vitrine.md): as concluídas mais recentes primeiro.
// Mesma página do mural, com outra lista; o visitante também vê só uma prévia. É aqui que entra o build in public.
export default function ShowcasePage() {
  return (
    <main id="conteudo" className={styles.page}>
      <div className={styles.intro}>
        <h1 className={styles.display}>Projetos concluídos</h1>
        <p className={styles.lead}>Ideias de alunos de TI da FAESA que saíram do papel.</p>
      </div>
      <h2 className="sr-only">Projetos</h2>
      <Suspense fallback={<Skeleton />}>
        <IdeaList
          path="/api/ideas?status=done"
          errorTitle="Não foi possível carregar a vitrine"
          emptyTitle="Nenhum projeto concluído ainda"
          emptyText="Quando um autor marcar a ideia como concluída, ela aparece aqui."
          invite="para ver todos os projetos concluídos."
        />
      </Suspense>
    </main>
  );
}

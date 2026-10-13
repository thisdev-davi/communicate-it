import { redirect, unstable_rethrow } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { StatePanel } from "../../../components/StatePanel";
import { IdeaForm } from "../../../idea-form";
import { type Idea } from "../../../ideas";
import { getMe } from "../../../me";
import { getIdea } from "../get-idea";
import styles from "../ideia.module.css";

// Contrato da fatia 6 (docs/contratos/fatia-6-editar-e-apagar.md): o formulário do postar, já preenchido.
// Só o autor edita; quem não é o autor volta para a página da ideia (a API também recusa, 403).
async function EditIdea({ params }: { params: PageProps<"/ideias/[id]/editar">["params"] }) {
  const me = await getMe();
  if (!me) redirect("/login");
  if (!me.course) redirect("/cadastro");

  const { id } = await params;
  let idea: Idea;
  try {
    idea = await getIdea(id);
  } catch (err) {
    unstable_rethrow(err); // deixa passar o notFound, o redirect e os erros internos do Next
    console.error("buscar ideia para editar:", err);
    return (
      <StatePanel tone="error" title="Não foi possível carregar a ideia">
        Pode ser uma instabilidade rápida. Atualize a página em alguns instantes.
      </StatePanel>
    );
  }
  if (idea.author.id !== me.id) redirect(`/ideias/${idea.id}`);
  return (
    <>
      <Link href={`/ideias/${idea.id}`} className={styles.back}>
        Voltar à ideia
      </Link>
      <IdeaForm idea={idea} />
    </>
  );
}

// O link de volta precisa do id, que só existe na requisição: ele sai junto do formulário, dentro do Suspense.
export default function EditIdeaPage({ params }: PageProps<"/ideias/[id]/editar">) {
  return (
    <main id="conteudo" className={styles.page}>
      <Suspense
        fallback={
          <p className={styles.loading} role="status">
            Carregando ideia…
          </p>
        }
      >
        <EditIdea params={params} />
      </Suspense>
    </main>
  );
}

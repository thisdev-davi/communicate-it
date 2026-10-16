import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { EventForm } from "../event-form";
import { getMe } from "../../me";
import styles from "../../ideias/[id]/ideia.module.css";

// Só quem está logado e já tem curso cria; a API também recusa sem sessão (401).
async function CreateEvent() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (!me.course) redirect("/cadastro");
  return <EventForm />;
}

// A coluna estreita dos formulários, como o postar ideia.
export default function NewEventPage() {
  return (
    <main id="conteudo" className={styles.page}>
      <Link href="/eventos" className={styles.back}>
        Voltar aos eventos
      </Link>
      <Suspense
        fallback={
          <p className={styles.loading} role="status">
            Carregando…
          </p>
        }
      >
        <CreateEvent />
      </Suspense>
    </main>
  );
}

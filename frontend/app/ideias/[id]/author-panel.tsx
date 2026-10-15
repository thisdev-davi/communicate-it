"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, ButtonLink } from "../../components/Button";
import styles from "./ideia.module.css";
import { StatusControl } from "./status-control";

// Painel "Sua ideia", só para o autor: status (fatia 7), editar e apagar (docs/contratos/fatia-6-editar-e-apagar.md).
// Apagar é de vez, então pede confirmação na caixa nativa do navegador (já acessível, sem modal próprio).
export function AuthorPanel({ ideaId, status }: { ideaId: number; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  function remove() {
    if (!confirm("Apagar esta ideia? Os interessados saem da lista e não dá para desfazer.")) return;
    setFailed(false);
    startTransition(async () => {
      const res = await fetch(`/api/ideas/${ideaId}`, { method: "DELETE" }).catch(() => null);
      if (res?.status === 401) {
        startTransition(() => router.push("/login")); // a sessão expirou
        return;
      }
      // 404: já tinha sido apagada (em outra aba, por exemplo). O resultado é o mesmo, então segue para o mural.
      if (!res?.ok && res?.status !== 404) {
        setFailed(true);
        return;
      }
      startTransition(() => router.push("/"));
    });
  }

  return (
    <section className={`card ${styles.panel}`} aria-labelledby="sua-ideia">
      <h2 id="sua-ideia" className={styles.section}>
        Sua ideia
      </h2>
      <StatusControl ideaId={ideaId} status={status} />
      <div className={styles.actions}>
        <ButtonLink href={`/ideias/${ideaId}/editar`} variant="secondary">
          Editar ideia
        </ButtonLink>
        <Button variant="danger" disabled={pending} onClick={remove}>
          {pending ? "Apagando…" : "Apagar ideia"}
        </Button>
      </div>
      {failed && (
        <p className={styles.error} role="alert">
          Não foi possível apagar. Tente de novo.
        </p>
      )}
    </section>
  );
}

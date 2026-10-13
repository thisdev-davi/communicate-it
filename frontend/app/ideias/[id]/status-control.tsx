"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "../../components/Button";
import { STATUSES } from "../../ideas";
import styles from "./ideia.module.css";

// Status da ideia, só para o autor (docs/contratos/fatia-7-status.md). O clique já salva; quem diz o estado é o servidor:
// depois de gravar, o router.refresh() redesenha o selo do card, o botão marcado e a trava do "Quero participar".
export function StatusControl({ ideaId, status }: { ideaId: number; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  function change(next: string) {
    setFailed(false);
    startTransition(async () => {
      const res = await fetch(`/api/ideas/${ideaId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      }).catch(() => null);
      if (res?.status === 401) {
        startTransition(() => router.push("/login")); // a sessão expirou
        return;
      }
      if (!res?.ok) {
        setFailed(true);
        return;
      }
      startTransition(() => router.refresh());
    });
  }

  return (
    <div className={styles.status}>
      <p id="status-da-ideia" className={styles.label}>
        Status
      </p>
      <div role="group" aria-labelledby="status-da-ideia" className={styles.actions}>
        {Object.entries(STATUSES).map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            variant={value === status ? "primary" : "secondary"}
            aria-pressed={value === status}
            disabled={pending}
            onClick={() => value !== status && change(value)}
          >
            {label}
          </Button>
        ))}
      </div>
      <p className={styles.hint}>Só ideias abertas recebem novos interessados. Concluídas vão para a vitrine.</p>
      {failed && (
        <p className={styles.error} role="alert">
          Não foi possível trocar o status. Tente de novo.
        </p>
      )}
    </div>
  );
}

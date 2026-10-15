"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { STATUSES } from "../../ideas";
import styles from "./ideia.module.css";

// A cor de cada status, a mesma do selo do card (StatusBadge).
const TONE: Record<string, string> = {
  open: styles.toneOpen,
  in_progress: styles.toneProgress,
  done: styles.toneDone,
};

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
      {/* Selos clicáveis: o marcado fica igual ao selo do card; os outros, neutros, com o losango na cor do status. */}
      <div role="group" aria-labelledby="status-da-ideia" className={styles.chips}>
        {Object.entries(STATUSES).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`${styles.chip} ${TONE[value]}`}
            aria-pressed={value === status}
            disabled={pending}
            onClick={() => value !== status && change(value)}
          >
            <span className={styles.mark} aria-hidden="true" />
            {label}
          </button>
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

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Icon, type IconName } from "../../components/Icon";
import { STATUSES } from "../../ideas";
import styles from "./ideia.module.css";

// Cada status com o seu ícone e a cor do selo do card (o segmento marcado mostra como o selo vai ficar).
const LOOK: Record<string, { icon: IconName; tone: string }> = {
  open: { icon: "door-open", tone: styles.toneOpen },
  in_progress: { icon: "hammer", tone: styles.toneProgress },
  done: { icon: "flag", tone: styles.toneDone },
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
      {/* Seletor segmentado: uma trilha com os três; o marcado sobe (fundo do card e sombra) e ganha a cor do status. */}
      <div role="group" aria-labelledby="status-da-ideia" className={styles.segments}>
        {Object.entries(STATUSES).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`${styles.segment} ${LOOK[value].tone}`}
            aria-pressed={value === status}
            disabled={pending}
            onClick={() => value !== status && change(value)}
          >
            <Icon name={LOOK[value].icon} />
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

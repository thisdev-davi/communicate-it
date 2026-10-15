"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "./Button";
import styles from "./InterestButton.module.css";

// "Quero participar" alternável (docs/contratos/fatia-5-quero-participar.md). Sem aprovação: o clique já põe na lista.
// Quem diz o estado é o servidor: depois de gravar, o router.refresh() redesenha card e página com o contador certo.
// O refresh roda dentro da transição, então o botão fica desabilitado até o estado novo chegar (sem piscar o antigo).
export function InterestButton({ ideaId, interested }: { ideaId: number; interested: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const [joined, setJoined] = useState(false); // entrou agora, neste clique: só então o check anima (não a cada visita)

  function toggle() {
    setFailed(false);
    startTransition(async () => {
      const res = await fetch(`/api/ideas/${ideaId}/interest`, { method: interested ? "DELETE" : "PUT" }).catch(() => null);
      if (res?.status === 401) {
        startTransition(() => router.push("/login")); // a sessão expirou
        return;
      }
      if (res?.status === 409) {
        startTransition(() => router.refresh()); // a ideia travou com a página aberta: o servidor redesenha sem o botão
        return;
      }
      if (!res?.ok) {
        setFailed(true);
        return;
      }
      setJoined(!interested);
      startTransition(() => router.refresh());
    });
  }

  return (
    <div className={styles.action}>
      {/* A mão levantada (o ícone dos interessados) vira o check de quem entrou. */}
      <Button
        variant={interested ? "joined" : "accent"}
        pill
        icon={interested ? "check" : "hand"}
        className={interested && joined ? styles.pop : undefined}
        aria-pressed={interested}
        disabled={pending}
        onClick={toggle}
      >
        {interested ? "Interessado" : "Quero participar"}
      </Button>
      {failed && (
        <p className={styles.error} role="alert">
          Não foi possível salvar. Tente de novo.
        </p>
      )}
    </div>
  );
}

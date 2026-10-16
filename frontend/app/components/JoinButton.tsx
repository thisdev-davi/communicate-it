"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "./Button";
import styles from "./JoinButton.module.css";

// Entrar e sair de uma lista, sem aprovação: o "Quero participar" da ideia (docs/contratos/fatia-5-quero-participar.md)
// e o "Vou participar" do evento (docs/contratos/fatia-14-presenca-em-eventos.md). `url` recebe PUT para entrar e
// DELETE para sair; `labels` são o texto fora e dentro da lista.
// Quem diz o estado é o servidor: depois de gravar, o router.refresh() redesenha card e página com o contador certo.
// O refresh roda dentro da transição, então o botão fica desabilitado até o estado novo chegar (sem piscar o antigo).
export function JoinButton({ url, on, labels }: { url: string; on: boolean; labels: [off: string, on: string] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const [joined, setJoined] = useState(false); // entrou agora, neste clique: só então o check anima (não a cada visita)

  function toggle() {
    setFailed(false);
    startTransition(async () => {
      const res = await fetch(url, { method: on ? "DELETE" : "PUT" }).catch(() => null);
      if (res?.status === 401) {
        startTransition(() => router.push("/login")); // a sessão expirou
        return;
      }
      if (res?.status === 409) {
        startTransition(() => router.refresh()); // a ideia travou ou o evento passou com a página aberta: o servidor redesenha sem o botão
        return;
      }
      if (!res?.ok) {
        setFailed(true);
        return;
      }
      setJoined(!on);
      startTransition(() => router.refresh());
    });
  }

  return (
    <div className={styles.action}>
      {/* A mão levantada (o ícone dos interessados) vira o check de quem entrou. */}
      <Button
        variant={on ? "joined" : "accent"}
        pill
        icon={on ? "check" : "hand"}
        className={on && joined ? styles.pop : undefined}
        aria-pressed={on}
        disabled={pending}
        onClick={toggle}
      >
        {labels[on ? 1 : 0]}
      </Button>
      {failed && (
        <p className={styles.error} role="alert">
          Não foi possível salvar. Tente de novo.
        </p>
      )}
    </div>
  );
}

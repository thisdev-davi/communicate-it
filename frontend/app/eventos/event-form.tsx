"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "../components/Button";
import { Notice } from "../components/Notice";
import { TextField } from "../components/TextField";
import type { ApiError } from "../ideas";
import styles from "../idea-form.module.css";

// O que fazer em cada campo que a API marcar no 400, no lugar do texto técnico dela.
const FIX: Record<string, string> = {
  title: "Use de 3 a 120 caracteres.",
  description: "Escreva a descrição, com até 5000 caracteres.",
  starts_at: "Escolha uma data e hora que ainda não passaram.",
  location: "Use de 3 a 120 caracteres.",
};

// Cria um evento (docs/contratos/fatia-13-agenda-de-eventos.md). Sem validação no navegador de propósito,
// como no postar ideia: os erros exibidos são os do 400 da API.
export function EventForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // No envio com erro, o foco vai para o primeiro campo inválido (roda depois que o aria-invalid chegou ao DOM).
  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [fields]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)); // antes do setSending: campos desabilitados ficam fora
    const local = String(data.starts_at ?? ""); // "2026-10-20T19:00", sem fuso
    setSending(true);
    setFields({});
    setMessage(null);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ponytail: -03:00 fixo porque o Brasil está sem horário de verão desde 2019; se ele voltar, converter com o fuso America/Sao_Paulo.
        body: JSON.stringify({ ...data, starts_at: local && `${local}:00-03:00` }),
      });
      if (res.ok) {
        router.push("/eventos"); // a página do evento é da fatia 14; o formulário fica travado até a troca de página
        return;
      }
      const body: ApiError = await res.json();
      setFields(body.fields ?? {});
      setMessage(body.fields ? "Corrija os campos indicados." : "Não foi possível criar o evento. Tente de novo.");
    } catch {
      setMessage("Não foi possível criar o evento. Confira sua conexão e tente de novo.");
    }
    setSending(false);
  }

  const error = (name: string) => fields[name] && (FIX[name] ?? fields[name]);

  return (
    <section className={`card ${styles.card}`} aria-labelledby="criar-evento">
      <h1 id="criar-evento" className={styles.title}>
        Criar evento
      </h1>
      <p className={styles.lead}>Marque um encontro, um dia de trabalho ou um hackathon. O horário é o de Brasília.</p>
      {message && <Notice tone="danger">{message}</Notice>}
      <form ref={formRef} onSubmit={handleSubmit}>
        {/* fieldset disabled trava todos os campos e o botão durante o envio */}
        <fieldset disabled={sending} className={styles.fields}>
          <TextField name="title" autoComplete="off" label="Título" hint="De 3 a 120 caracteres." error={error("title")} />
          <TextField
            name="description"
            rows={5}
            label="Descrição"
            hint="O que vai rolar e o que levar. Até 5000 caracteres."
            error={error("description")}
          />
          <div className={styles.row}>
            <TextField name="starts_at" type="datetime-local" label="Data e hora" error={error("starts_at")} />
            <TextField
              name="location"
              autoComplete="off"
              label="Local"
              hint="Sala, bloco ou canal do Discord."
              error={error("location")}
            />
          </div>
          <div className={styles.actions}>
            <Button type="submit" icon={sending ? undefined : "calendar-plus"}>
              {sending ? "Enviando…" : "Criar evento"}
            </Button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}

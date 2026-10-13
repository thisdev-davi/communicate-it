"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "./components/Button";
import { Notice } from "./components/Notice";
import { Select } from "./components/Select";
import { TextField } from "./components/TextField";
import { CATEGORIES, COURSES, type ApiError, type Idea } from "./ideas";
import styles from "./idea-form.module.css";

// O que fazer em cada campo que a API marcar no 400, no lugar do texto técnico dela.
const FIX: Record<string, string> = {
  title: "Use de 3 a 120 caracteres.",
  description: "Escreva a descrição, com até 5000 caracteres.",
  course: "Escolha o curso.",
  category: "Escolha a categoria.",
  slots: "Escolha um número de 1 a 20.",
};

// Respostas da API sem campos (403, 404) traduzidas para o que aconteceu.
const ERRORS: Record<string, string> = {
  not_author: "Só o autor pode editar esta ideia.",
  not_found: "Esta ideia não existe mais.",
};

// Sem `idea`, posta uma ideia nova; com ela, edita essa ideia (docs/contratos/fatia-6-editar-e-apagar.md),
// com os campos já preenchidos.
export function IdeaForm({ idea }: { idea?: Idea }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const verb = idea ? "salvar" : "postar"; // nas mensagens de erro

  // No envio com erro, o foco vai para o primeiro campo inválido (roda depois que o aria-invalid chegou ao DOM).
  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [fields]);

  // Sem validação no navegador de propósito: os erros exibidos são os do 400 da API.
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form); // antes do setSending: campos desabilitados ficam fora do FormData
    setSending(true);
    setFields({});
    setMessage(null);
    try {
      const res = await fetch(idea ? `/api/ideas/${idea.id}` : "/api/ideas", {
        method: idea ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(data), slots: Number(data.get("slots")) }),
      });
      if (res.ok) {
        const saved: Idea = await res.json();
        router.push(`/ideias/${saved.id}`); // o aluno vê a ideia como os outros vão ver; o formulário fica travado até a troca de página
        return;
      }
      const body: ApiError = await res.json();
      setFields(body.fields ?? {});
      setMessage(body.fields ? "Corrija os campos indicados." : (ERRORS[body.error] ?? `Não foi possível ${verb} a ideia. Tente de novo.`));
    } catch {
      setMessage(`Não foi possível ${verb} a ideia. Confira sua conexão e tente de novo.`);
    }
    setSending(false);
  }

  const error = (name: string) => fields[name] && (FIX[name] ?? fields[name]);

  return (
    <section className={`card ${styles.card}`} aria-labelledby="postar-ideia">
      <h1 id="postar-ideia" className={styles.title}>
        {idea ? "Editar ideia" : "Postar ideia"}
      </h1>
      <p className={styles.lead}>
        {idea ? "Ajuste o que mudou. Quem já se interessou continua na lista." : "Conte o problema e o que você quer construir."}
      </p>
      {message && <Notice tone="danger">{message}</Notice>}
      <form ref={formRef} onSubmit={handleSubmit}>
        {/* fieldset disabled trava todos os campos e o botão durante o envio */}
        <fieldset disabled={sending} className={styles.fields}>
          <TextField
            name="title"
            autoComplete="off"
            label="Título"
            hint="De 3 a 120 caracteres."
            defaultValue={idea?.title}
            error={error("title")}
          />
          <TextField
            name="description"
            rows={6}
            label="Descrição"
            hint="O problema, a ideia e quem você procura. Até 5000 caracteres."
            defaultValue={idea?.description}
            error={error("description")}
          />
          <div className={styles.row}>
            <Select name="course" label="Curso" placeholder="Selecione…" options={COURSES} defaultValue={idea?.course ?? ""} error={error("course")} />
            <Select
              name="category"
              label="Categoria"
              placeholder="Selecione…"
              options={CATEGORIES}
              defaultValue={idea?.category ?? ""}
              error={error("category")}
            />
          </div>
          <TextField
            name="slots"
            type="number"
            inputMode="numeric"
            label="Quantas pessoas você procura?"
            hint="De 1 a 20."
            defaultValue={idea?.slots}
            error={error("slots")}
          />
          <div className={styles.actions}>
            {idea ? (
              <Button type="submit">{sending ? "Salvando…" : "Salvar alterações"}</Button>
            ) : (
              <Button type="submit" icon={sending ? undefined : "lightbulb"}>
                {sending ? "Enviando…" : "Postar ideia"}
              </Button>
            )}
          </div>
        </fieldset>
      </form>
    </section>
  );
}

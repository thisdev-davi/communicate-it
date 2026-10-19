"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "../../components/Button";
import { Notice } from "../../components/Notice";
import { Select } from "../../components/Select";
import { SkillsField } from "../../components/SkillsField";
import form from "../../idea-form.module.css";
import { COURSES, type ApiError } from "../../ideas";
import type { Me } from "../../me";

export function ProfileForm({ me }: { me: Me }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // No envio com erro, o foco vai para o primeiro campo inválido (roda depois que o aria-invalid chegou ao DOM).
  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [fields]);

  // Sem validação no navegador de propósito (nem trava na 6ª caixa): os erros exibidos são os do 400 da API.
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget); // antes do setSending: campos desabilitados ficam fora do FormData
    setSending(true);
    setFields({});
    setMessage(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // getAll: uma entrada por caixa marcada; nenhuma marcada vira [], que limpa as habilidades.
        body: JSON.stringify({ course: data.get("course"), skills: data.getAll("skills") }),
      });
      if (res.ok) {
        router.push(`/alunos/${me.id}`); // o formulário fica travado até a troca de página
        return;
      }
      if (res.status === 401) {
        router.push("/login"); // a sessão expirou: o formulário fica travado até a troca de página
        return;
      }
      const body: ApiError = await res.json();
      setFields(body.fields ?? {});
      setMessage(body.fields ? "Corrija os campos indicados." : "Não foi possível salvar o perfil. Tente de novo.");
    } catch {
      setMessage("Não foi possível salvar o perfil. Confira sua conexão e tente de novo.");
    }
    setSending(false);
  }

  return (
    <section className={`card ${form.card}`} aria-labelledby="editar-perfil">
      <h1 id="editar-perfil" className={form.title}>
        Editar perfil
      </h1>
      <p className={form.lead}>O nome e a foto vêm do Discord e se atualizam a cada login.</p>
      {message && <Notice tone="danger">{message}</Notice>}
      <form ref={formRef} onSubmit={handleSubmit}>
        {/* fieldset disabled trava todos os campos e o botão durante o envio */}
        <fieldset disabled={sending} className={form.fields}>
          <Select
            name="course"
            label="Curso"
            options={COURSES}
            defaultValue={me.course ?? ""}
            error={fields.course && "Escolha o curso."}
          />
          <SkillsField label="Habilidades" hint="Escolha até 5." defaultValue={me.skills} error={fields.skills && "Escolha até 5 habilidades da lista."} />
          <div className={form.actions}>
            <Button type="submit">{sending ? "Salvando…" : "Salvar alterações"}</Button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}

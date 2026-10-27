import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ButtonLink } from "../components/Button";
import { Logo } from "../components/Logo";
import { Notice } from "../components/Notice";
import { getMe } from "../me";
import styles from "./login.module.css";

// Motivos que a API manda em /login?erro=... quando o login não dá certo.
const errors: Record<string, string> = {
  cancelado: "Login cancelado no Discord. Tente de novo quando quiser.",
  fora_do_servidor: "Você precisa estar no servidor da comunidade no Discord para entrar.",
  falhou: "Não foi possível entrar. Tente de novo.",
};

async function LoginBox({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  if (await getMe()) redirect("/");

  const { erro } = await searchParams;
  const message = typeof erro === "string" && Object.hasOwn(errors, erro) ? errors[erro] : null;
  const invite = process.env.DISCORD_INVITE_URL;
  // reload: a API responde com redirect para o Discord, precisa ser navegação completa.
  const button = (
    <ButtonLink href="/api/auth/discord" reload icon="discord" className={styles.wide}>
      Entrar com Discord
    </ButtonLink>
  );
  return (
    <>
      {message && (
        <Notice>
          {message}
          {erro === "fora_do_servidor" && invite && " Entre pelo passo 1 e depois tente de novo."}
        </Notice>
      )}
      {/* O login só aceita quem já está no servidor: o convite vem antes do botão, não só depois de falhar. */}
      {invite ? (
        <ol className={styles.steps}>
          <li>
            Entre no{" "}
            <a href={invite} target="_blank" rel="noopener noreferrer" className={styles.invite}>
              servidor da comunidade<span className="sr-only"> (abre em nova aba)</span>
            </a>
            , se ainda não estiver nele.
          </li>
          <li>{button}</li>
        </ol>
      ) : (
        button
      )}
    </>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main id="conteudo" className={`card ${styles.card}`}>
      <Logo size={48} withName={false} />
      <h1 className={styles.title}>Entrar</h1>
      <p className={styles.lead}>Use sua conta do Discord, a mesma do servidor da comunidade.</p>
      <Suspense fallback={<p className={styles.lead}>Carregando…</p>}>
        <LoginBox searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

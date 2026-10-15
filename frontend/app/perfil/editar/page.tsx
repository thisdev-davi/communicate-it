import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import styles from "../../ideias/[id]/ideia.module.css";
import { getMe } from "../../me";
import { ProfileForm } from "./profile-form";

// Contrato da fatia 11 (docs/contratos/fatia-11-habilidades.md): cada um edita só o próprio perfil, então a rota
// não tem id; os dados vêm da sessão (GET /api/me).
async function EditProfile() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (!me.course) redirect("/cadastro");
  return (
    <>
      <Link href={`/alunos/${me.id}`} className={styles.back}>
        Voltar ao perfil
      </Link>
      <ProfileForm me={me} />
    </>
  );
}

// Mesma coluna dos formulários de ideia. O link de volta precisa do id da sessão: sai junto, dentro do Suspense.
export default function EditProfilePage() {
  return (
    <main id="conteudo" className={styles.page}>
      <Suspense
        fallback={
          <p className={styles.loading} role="status">
            Carregando…
          </p>
        }
      >
        <EditProfile />
      </Suspense>
    </main>
  );
}

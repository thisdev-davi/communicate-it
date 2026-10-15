import Link from "next/link";
import { Avatar } from "./components/Avatar";
import styles from "./header.module.css";
import { LoginLink } from "./login-link";
import { LogoutButton } from "./logout-button";
import { getMe } from "./me";

// Devolve os itens soltos (fragment): eles entram direto na linha flex do cabeçalho.
export async function UserMenu() {
  const me = await getMe();
  if (!me) return <LoginLink />;
  return (
    <>
      {/* Foto e nome levam ao próprio perfil. O nome escrito dá o nome do link (a foto é decorativa);
          no celular o nome some da tela, e o "Meu perfil" continua para o leitor de tela. */}
      <Link href={`/alunos/${me.id}`} className={styles.me}>
        <Avatar name={me.name} src={me.avatar_url} decorative />
        <span className="sr-only">Meu perfil: </span>
        <span className={styles.name}>{me.name}</span>
      </Link>
      <LogoutButton />
    </>
  );
}

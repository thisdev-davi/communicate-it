import Link from "next/link";
import { StatePanel } from "../../components/StatePanel";
import mural from "../../mural.module.css";
import styles from "./perfil.module.css";

// Aparece quando a página chama notFound(): aluno que não existe ou id inválido (mesmo esquema da página da ideia).
export default function ProfileNotFound() {
  return (
    <main id="conteudo" className={mural.page}>
      <Link href="/" className={styles.back}>
        Voltar ao mural
      </Link>
      <StatePanel title="Aluno não encontrado">O link pode estar incompleto. Volte ao mural e abra o perfil pelo card.</StatePanel>
    </main>
  );
}

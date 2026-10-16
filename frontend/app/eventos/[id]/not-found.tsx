import Link from "next/link";
import { StatePanel } from "../../components/StatePanel";
import styles from "../../ideias/[id]/ideia.module.css";

// Aparece quando a página chama notFound(): evento que não existe ou id inválido.
export default function EventNotFound() {
  return (
    <main id="conteudo" className={styles.page}>
      <Link href="/eventos" className={styles.back}>
        Voltar aos eventos
      </Link>
      <StatePanel title="Evento não encontrado">Ele pode ter sido removido, ou o link está incompleto.</StatePanel>
    </main>
  );
}

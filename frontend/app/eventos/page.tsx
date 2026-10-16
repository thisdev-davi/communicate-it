import { cookies } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { ButtonLink } from "../components/Button";
import { EventCard } from "../components/EventCard";
import { StatePanel } from "../components/StatePanel";
import type { CommunityEvent } from "../events";
import { API_URL } from "../ideas";
import { getMe } from "../me";
import styles from "../mural.module.css";

const ABOUT = "Encontros, dias de trabalho e hackathons da comunidade de TI da FAESA.";

async function Lead() {
  if (await getMe()) return <p className={styles.lead}>{ABOUT}</p>;
  return (
    <p className={styles.lead}>
      {ABOUT} <Link href="/login">Entre com o Discord</Link> para criar um evento.
    </p>
  );
}

async function CreateAction() {
  const me = await getMe();
  return (
    me && (
      <ButtonLink href="/eventos/novo" icon="calendar-plus">
        Criar evento
      </ButtonLink>
    )
  );
}

// A agenda (docs/contratos/fatia-13-agenda-de-eventos.md): de hoje em diante, do mais próximo, para todo mundo.
// Logado sem curso ainda não terminou o cadastro: vai para lá antes, como no mural.
// Repassa o cookie do navegador: só com ele a API diz em quais eventos a pessoa confirmou presença.
async function Agenda() {
  const me = await getMe();
  if (me && !me.course) redirect("/cadastro");
  const cookie = (await cookies()).toString();
  let items: CommunityEvent[];
  try {
    const res = await fetch(`${API_URL}/api/events`, { headers: { cookie } });
    if (!res.ok) throw new Error(`status ${res.status}`);
    ({ items } = await res.json());
  } catch (err) {
    unstable_rethrow(err);
    console.error("listar eventos:", err);
    return (
      <StatePanel tone="error" title="Não foi possível carregar os eventos">
        Pode ser uma instabilidade rápida. Atualize a página em alguns instantes.
      </StatePanel>
    );
  }
  if (items.length === 0) {
    return (
      <StatePanel title="Nenhum evento marcado">
        {me ? "Que tal marcar o primeiro? Um dia de trabalho já conta." : "Quando alguém marcar um evento, ele aparece aqui."}
      </StatePanel>
    );
  }
  return (
    <ul className={styles.grid}>
      {items.map((e) => (
        <li key={e.id}>
          <EventCard event={e} />
        </li>
      ))}
    </ul>
  );
}

export default function EventsPage() {
  return (
    <main id="conteudo" className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.intro}>
          <h1 className={styles.display}>Eventos</h1>
          <Suspense fallback={<p className={styles.lead}>{ABOUT}</p>}>
            <Lead />
          </Suspense>
        </div>
        <Suspense fallback={null}>
          <CreateAction />
        </Suspense>
      </div>
      <h2 className="sr-only">Próximos eventos</h2>
      <Suspense
        fallback={
          <p className={styles.lead} role="status">
            Carregando eventos…
          </p>
        }
      >
        <Agenda />
      </Suspense>
    </main>
  );
}

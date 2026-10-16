import Link from "next/link";
import type { CommunityEvent } from "../events";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import styles from "./EventCard.module.css";

// Tudo no horário de Brasília, onde os eventos acontecem, seja qual for o fuso de quem vê.
const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", ...opts });
const DAY = fmt({ day: "numeric" });
const MONTH = fmt({ month: "short" }); // "out."
const WEEKDAY = fmt({ weekday: "short" }); // "ter."
const TIME = fmt({ hour: "2-digit", minute: "2-digit" }); // "19:00"
const FULL = fmt({ day: "numeric", month: "long" }); // "20 de outubro", para o leitor de tela

// EventCard do design system: bloco de data em `primary` com o losango âmbar, título, hora, local, descrição e organizador.
// Como o IdeaCard, o card não tem ação; o único destino é o perfil do organizador.
export function EventCard({ event }: { event: CommunityEvent }) {
  const start = new Date(event.starts_at);
  return (
    <article className={`card ${styles.card}`}>
      {/* O leitor de tela ouve a data por extenso na linha da hora; o bloco é só visual. */}
      <div className={styles.date} aria-hidden="true">
        <span className={styles.day}>{DAY.format(start)}</span>
        <span className={styles.month}>{MONTH.format(start).replace(".", "")}</span>
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{event.title}</h3>
        <ul className={styles.facts}>
          <li>
            <Icon name="clock" size={14} />
            <time dateTime={event.starts_at}>
              <span className="sr-only">{FULL.format(start)}, </span>
              {WEEKDAY.format(start).replace(".", "")}, {TIME.format(start)}
            </time>
          </li>
          <li>
            <Icon name="map-pin" size={14} />
            <span className="sr-only">Local: </span>
            {event.location}
          </li>
        </ul>
        <p className={styles.desc}>{event.description}</p>
        <footer className={styles.foot}>
          {/* Como o autor no IdeaCard: foto e nome; o "Organizado por" é só para o leitor de tela, para caber no card estreito. */}
          <Link href={`/alunos/${event.author.id}`} className={styles.profile}>
            <Avatar name={event.author.name} src={event.author.avatar_url} decorative />
            <span className={styles.author}>
              <span className="sr-only">Organizado por </span>
              {event.author.name}
            </span>
          </Link>
        </footer>
      </div>
    </article>
  );
}

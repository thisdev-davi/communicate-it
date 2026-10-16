import Link from "next/link";
import type { ReactNode } from "react";
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
// Na agenda, como o IdeaCard, o card não tem ação e tem dois destinos: o título (link esticado) leva à página do evento
// e o organizador ao perfil dele. Quem confirmou vê a borda de destaque e o selo "Você vai".
// `full` é a própria página do evento: título vira h1, nada é cortado e não há link; `action` (o botão de presença)
// ocupa a direita do rodapé.
export function EventCard({ event, full = false, action }: { event: CommunityEvent; full?: boolean; action?: ReactNode }) {
  const start = new Date(event.starts_at);
  const Title = full ? "h1" : "h3";
  return (
    <article className={["card", styles.card, full && styles.full, event.going && styles.going].filter(Boolean).join(" ")}>
      {/* O leitor de tela ouve a data por extenso na linha da hora; o bloco é só visual. */}
      <div className={styles.date} aria-hidden="true">
        <span className={styles.day}>{DAY.format(start)}</span>
        <span className={styles.month}>{MONTH.format(start).replace(".", "")}</span>
      </div>
      <div className={styles.body}>
        <Title className={styles.title}>
          {full ? (
            event.title
          ) : (
            <Link href={`/eventos/${event.id}`} className={styles.link}>
              {event.title}
            </Link>
          )}
        </Title>
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
          <li>
            <Icon name="users" size={14} />
            {event.attendee_count} {event.attendee_count === 1 ? "confirmado" : "confirmados"}
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
          {action ??
            (event.going && (
              <span className={styles.badge}>
                <Icon name="circle-check" size={14} />
                Você vai
              </span>
            ))}
        </footer>
      </div>
    </article>
  );
}

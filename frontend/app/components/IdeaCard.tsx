import Link from "next/link";
import type { ReactNode } from "react";
import { CATEGORIES, COURSE_SHORT, COURSES, STATUSES, type Idea } from "../ideas";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import styles from "./IdeaCard.module.css";

const TONE: Record<string, string> = {
  open: styles.open,
  in_progress: styles.progress,
  done: styles.done,
};

// "postada em DD/MM", no horário de Brasília.
const dayMonth = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });

// StatusBadge do design system: recebe o status cru da API e sempre mostra a palavra junto da cor.
function StatusBadge({ status }: { status: string }) {
  const s = status in STATUSES ? status : "open";
  return (
    <span className={`${styles.badge} ${TONE[s]}`}>
      <span className={styles.mark} aria-hidden="true" />
      {STATUSES[s]}
    </span>
  );
}

// Só o que a API devolve hoje: sem habilidades e sem @ do Discord.
// No mural, o card não tem ação (o título leva à página da ideia, é lá que se participa) e todos têm a mesma altura:
// etiqueta em 1 linha, título em até 2, descrição em 3 e o rodapé sempre embaixo. Quem já participa vê a borda de
// destaque e o selo "Você participa" na linha do autor.
// `full` é a própria página da ideia: título vira h1, nada é cortado e não há link (já estamos nela).
// `action` ocupa a direita da linha do autor: a página põe ali o "Quero participar".
export function IdeaCard({ idea, full = false, action }: { idea: Idea; full?: boolean; action?: ReactNode }) {
  const Title = full ? "h1" : "h3";
  return (
    <article className={[`card`, styles.card, full && styles.full, idea.interested && styles.interested].filter(Boolean).join(" ")}>
      <header className={styles.head}>
        <p className={styles.eyebrow}>
          {(full ? COURSES : COURSE_SHORT)[idea.course] ?? idea.course} · {CATEGORIES[idea.category] ?? idea.category}
        </p>
        <StatusBadge status={idea.status} />
      </header>
      <Title className={styles.title}>
        {full ? (
          idea.title
        ) : (
          <Link href={`/ideias/${idea.id}`} className={styles.link}>
            {idea.title}
          </Link>
        )}
      </Title>
      <p className={styles.desc}>{idea.description}</p>
      <footer className={styles.foot}>
        <div className={styles.byline}>
          <div className={styles.who}>
            <Avatar name={idea.author.name} src={idea.author.avatar_url} />
            <p className={styles.author}>{idea.author.name}</p>
          </div>
          {action ??
            (idea.interested && (
              <span className={`${styles.badge} ${styles.joined}`}>
                <Icon name="circle-check" size={14} />
                Você participa
              </span>
            ))}
        </div>
        <ul className={styles.facts}>
          <li>
            <Icon name="users" size={14} />
            {idea.slots} {idea.slots === 1 ? "vaga" : "vagas"}
          </li>
          <li>
            <Icon name="hand" size={14} />
            {idea.interest_count} {idea.interest_count === 1 ? "interessado" : "interessados"}
          </li>
          <li>
            <Icon name="calendar" size={14} />
            <span className="sr-only">postada em </span>
            <time dateTime={idea.created_at}>{dayMonth.format(new Date(idea.created_at))}</time>
          </li>
        </ul>
      </footer>
    </article>
  );
}

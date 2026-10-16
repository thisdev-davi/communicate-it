import { SKILLS } from "../ideas";
import { Icon } from "./Icon";
import styles from "./SkillChips.module.css";

// SkillChip do design system: habilidades na ordem do catálogo (a API grava assim). Chip neutro, só texto:
// laranja e as cores de status já têm dono. `have` são as habilidades de quem vê: as que batem ganham destaque
// (cor + ícone + texto para o leitor de tela) e vêm primeiro, para não sumirem no "+N". `max` corta a lista e mostra
// "+N" no lugar do resto.
export function SkillChips({
  skills,
  label = "Habilidades",
  have = [],
  max,
  className,
}: {
  skills: string[];
  label?: string;
  have?: string[];
  max?: number;
  className?: string;
}) {
  // sort é estável: dentro de cada grupo (tem / não tem) a ordem do catálogo continua.
  const shown = skills.toSorted((a, b) => Number(have.includes(b)) - Number(have.includes(a))).slice(0, max);
  return (
    <ul className={[styles.chips, className].filter(Boolean).join(" ")} aria-label={label}>
      {shown.map((s) => (
        <li key={s} className={have.includes(s) ? `${styles.chip} ${styles.have}` : styles.chip}>
          {have.includes(s) && <Icon name="check" size={14} />}
          {SKILLS[s] ?? s}
          {have.includes(s) && <span className="sr-only"> (você tem)</span>}
        </li>
      ))}
      {skills.length > shown.length && (
        <li className={styles.chip}>
          <span aria-hidden="true">+{skills.length - shown.length}</span>
          <span className="sr-only">e mais {skills.length - shown.length}</span>
        </li>
      )}
    </ul>
  );
}

import { SKILLS } from "../ideas";
import styles from "./SkillChips.module.css";

// SkillChip do design system: as habilidades do aluno, já na ordem do catálogo (a API grava assim).
// Chip neutro, só texto: laranja e as cores de status já têm dono.
export function SkillChips({ skills, className }: { skills: string[]; className?: string }) {
  return (
    <ul className={[styles.chips, className].filter(Boolean).join(" ")} aria-label="Habilidades">
      {skills.map((s) => (
        <li key={s} className={styles.chip}>
          {SKILLS[s] ?? s}
        </li>
      ))}
    </ul>
  );
}

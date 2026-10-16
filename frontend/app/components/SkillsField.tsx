import { useId } from "react";
import { SKILLS } from "../ideas";
import field from "./Field.module.css";
import styles from "./SkillsField.module.css";

// Caixas de seleção do catálogo de habilidades (editar perfil, postar e editar ideia). O legend é o rótulo, e a dica
// (ou o erro, que a substitui) é ligada a cada caixa. Sem limite no navegador: o erro exibido é o do 400 da API.
// Cada caixa marcada vira uma entrada "skills" no FormData (leia com getAll).
export function SkillsField({ label, hint, defaultValue, error }: { label: string; hint: string; defaultValue: string[]; error?: string }) {
  const hintId = useId();
  return (
    <fieldset className={`${styles.group} ${field.field} ${error ? field.invalid : ""}`}>
      <legend className={`${field.label} ${styles.legend}`}>{label}</legend>
      <p id={hintId} className={field.hint}>
        {error || hint}
      </p>
      <div className={styles.options}>
        {Object.entries(SKILLS).map(([value, name]) => (
          <label key={value} className={styles.option}>
            <input
              type="checkbox"
              name="skills"
              value={value}
              defaultChecked={defaultValue.includes(value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={hintId}
            />
            {name}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

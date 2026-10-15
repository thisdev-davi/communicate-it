import Image from "next/image";
import styles from "./Avatar.module.css";

// Duas letras: a primeira do primeiro nome e a do último ("Ana Ribeiro" → "AR").
function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return ((parts[0][0] ?? "?") + last).toUpperCase(); // nome vazio vira "?"
}

const PX = { sm: 28, lg: 72 };

// "sm" (28px) no cabeçalho, no card e nas listas; "lg" (72px) no topo do perfil. A foto vem do CDN do Discord.
// `decorative`: o nome já está escrito ao lado (ex.: dentro do link do autor), então o leitor de tela pula a foto
// em vez de ler o nome duas vezes.
export function Avatar({ name, src, size = "sm", decorative }: { name: string; src?: string | null; size?: "sm" | "lg"; decorative?: boolean }) {
  return (
    <span className={`${styles.avatar} ${styles[size]}`} aria-hidden={decorative || undefined}>
      {src ? (
        <Image src={src} alt={name} width={PX[size]} height={PX[size]} />
      ) : (
        <>
          <span aria-hidden="true">{initials(name)}</span>
          <span className="sr-only">{name}</span>
        </>
      )}
    </span>
  );
}

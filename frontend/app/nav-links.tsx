"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./header.module.css";

const LINKS = [
  { href: "/", label: "Mural" },
  { href: "/eventos", label: "Eventos" },
  { href: "/concluidas", label: "Concluídos" },
];
const MINE = { href: "/minhas-ideias", label: "Minhas ideias" }; // só para quem está logado

// Links da navegação principal; `current` marca a página atual (aria-current). Sem `current`, nenhum fica marcado:
// é o substituto do Suspense enquanto o caminho não é conhecido.
export function Links({ current, loggedIn = false }: { current?: string; loggedIn?: boolean }) {
  return (
    <ul className={styles.links}>
      {(loggedIn ? [...LINKS, MINE] : LINKS).map(({ href, label }) => (
        <li key={href}>
          <Link href={href} className={styles.link} aria-current={href === current ? "page" : undefined}>
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

// Com cacheComponents, o usePathname suspende nas rotas com id (/ideias/[id]): quem usa fica dentro de um Suspense.
export function NavLinks({ loggedIn }: { loggedIn: boolean }) {
  return <Links current={usePathname()} loggedIn={loggedIn} />;
}

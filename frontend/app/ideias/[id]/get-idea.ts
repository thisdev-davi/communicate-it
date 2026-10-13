import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { API_URL, type Idea } from "../../ideas";

// Busca uma ideia no servidor, repassando o cookie do navegador (sem ele a API responde 401).
// Ideia inexistente ou id inválido vira a página "Ideia não encontrada"; outro erro sobe para quem chamou.
// Quem chama precisa do unstable_rethrow no catch, para deixar passar o notFound e o redirect.
export async function getIdea(id: string): Promise<Idea> {
  const cookie = (await cookies()).toString();
  const res = await fetch(`${API_URL}/api/ideas/${encodeURIComponent(id)}`, { headers: { cookie } });
  if (res.status === 404) notFound(); // também para id inválido (abc, 0): a API responde 404
  if (res.status === 401) redirect("/login"); // a sessão expirou entre o getMe e aqui
  if (!res.ok) throw new Error(`status ${res.status}`);
  return res.json();
}

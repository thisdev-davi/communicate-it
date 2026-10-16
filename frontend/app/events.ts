// Tipos do contrato da fatia 13 (docs/contratos/fatia-13-agenda-de-eventos.md).

// Não é "Event": o nome é do evento do DOM, que é global no TypeScript.
export type CommunityEvent = {
  id: number;
  title: string;
  description: string;
  starts_at: string; // UTC; a tela mostra no horário de Brasília
  location: string;
  author: { id: number; name: string; avatar_url: string | null };
  created_at: string;
};

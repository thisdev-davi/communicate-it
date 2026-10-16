// Tipos dos contratos das fatias 13 e 14 (docs/contratos/fatia-13-agenda-de-eventos.md, fatia-14-presenca-em-eventos.md).

// Não é "Event": o nome é do evento do DOM, que é global no TypeScript.
export type CommunityEvent = {
  id: number;
  title: string;
  description: string;
  starts_at: string; // UTC; a tela mostra no horário de Brasília
  location: string;
  author: { id: number; name: string; avatar_url: string | null };
  created_at: string;
  attendee_count: number; // fatia 14: quantos confirmaram presença
  going: boolean; // quem pede confirmou
  attendees?: Attendee[]; // só vem para quem está logado, na página do evento
};

export type Attendee = {
  id: number;
  name: string;
  avatar_url: string | null;
};

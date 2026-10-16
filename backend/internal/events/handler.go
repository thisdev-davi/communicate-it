package events

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/thisdev-davi/comunica-faesa/backend/internal/ideas"
)

const maxBodyBytes = 64 << 10 // 64 KB

type Handler struct {
	q *Queries
	// userID diz quem está logado (0 = visitante). Recebe uma função, não o pacote auth: os testes trocam por um stub.
	userID func(*http.Request) (int64, error)
}

func NewHandler(db DBTX, userID func(*http.Request) (int64, error)) *Handler {
	return &Handler{q: New(db), userID: userID}
}

// Corpo do POST. starts_at chega como texto para o erro de formato sair por campo (com time.Time no struct,
// o Decode falharia inteiro com invalid_json); startsAt guarda o valor já convertido pelo validate.
type eventRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	StartsAt    string `json:"starts_at"`
	Location    string `json:"location"`
	startsAt    time.Time
}

type authorResponse struct {
	ID        int64   `json:"id"`
	Name      string  `json:"name"`
	AvatarURL *string `json:"avatar_url"`
}

type eventResponse struct {
	ID          int64          `json:"id"`
	Title       string         `json:"title"`
	Description string         `json:"description"`
	StartsAt    time.Time      `json:"starts_at"`
	Location    string         `json:"location"`
	Author      authorResponse `json:"author"`
	CreatedAt   time.Time      `json:"created_at"`
}

type errorResponse struct {
	Error  string            `json:"error"`
	Fields map[string]string `json:"fields,omitempty"`
}

// Create cria um evento; qualquer aluno logado, sem aprovação.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	authorID, err := h.userID(r)
	if err != nil {
		internalError(w, "session", err)
		return
	}
	if authorID == 0 {
		writeJSON(w, http.StatusUnauthorized, errorResponse{Error: "unauthenticated"})
		return
	}
	req, ok := readEvent(w, r)
	if !ok {
		return
	}
	row, err := h.q.CreateEvent(r.Context(), CreateEventParams{
		AuthorID:    authorID,
		Title:       req.Title,
		Description: req.Description,
		StartsAt:    req.startsAt,
		Location:    req.Location,
	})
	if err != nil {
		internalError(w, "create event", err)
		return
	}
	writeJSON(w, http.StatusCreated, toResponse(ListEventsRow(row)))
}

// List é a agenda: os eventos de hoje em diante, do mais próximo. Para todo mundo, visitante incluído.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.q.ListEvents(r.Context())
	if err != nil {
		internalError(w, "list events", err)
		return
	}
	items := make([]eventResponse, 0, len(rows)) // não-nil: lista vazia vira [] no JSON, não null
	for _, row := range rows {
		items = append(items, toResponse(row))
	}
	writeJSON(w, http.StatusOK, map[string][]eventResponse{"items": items})
}

// readEvent lê e valida o corpo. Com erro, já responde 400 ou 413 e devolve ok = false.
func readEvent(w http.ResponseWriter, r *http.Request) (req eventRequest, ok bool) {
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxBodyBytes)).Decode(&req); err != nil {
		var tooBig *http.MaxBytesError
		if errors.As(err, &tooBig) {
			writeJSON(w, http.StatusRequestEntityTooLarge, errorResponse{Error: "body_too_large"})
			return req, false
		}
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "invalid_json"})
		return req, false
	}
	if fields := req.validate(time.Now()); len(fields) > 0 {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "validation_failed", Fields: fields})
		return req, false
	}
	return req, true
}

// validate limpa os textos (trim), converte starts_at e devolve os erros por campo; vazio = válido.
// now vem de fora para o teste do "no futuro" não depender do relógio.
func (req *eventRequest) validate(now time.Time) map[string]string {
	req.Title = strings.TrimSpace(req.Title)
	req.Description = strings.TrimSpace(req.Description)
	req.Location = strings.TrimSpace(req.Location)
	req.StartsAt = strings.TrimSpace(req.StartsAt)

	fields := map[string]string{}
	ideas.CheckText(fields, "title", req.Title, 3, 120)
	ideas.CheckText(fields, "description", req.Description, 1, 5000)
	ideas.CheckText(fields, "location", req.Location, 3, 120)
	t, err := time.Parse(time.RFC3339, req.StartsAt) // RFC3339 exige o fuso: "2026-10-20T19:00:00" sem ele é recusado
	switch {
	case req.StartsAt == "":
		fields["starts_at"] = "obrigatório"
	case err != nil:
		fields["starts_at"] = "data inválida"
	case !t.After(now):
		fields["starts_at"] = "deve ser no futuro"
	}
	req.startsAt = t
	return fields
}

func toResponse(r ListEventsRow) eventResponse {
	return eventResponse{
		ID:          r.ID,
		Title:       r.Title,
		Description: r.Description,
		StartsAt:    r.StartsAt.UTC(),
		Location:    r.Location,
		Author:      authorResponse{ID: r.AuthorID, Name: r.AuthorName, AvatarURL: r.AuthorAvatarUrl},
		CreatedAt:   r.CreatedAt.UTC(),
	}
}

// writeJSON e internalError repetem os do pacote ideas de propósito, como no auth: um pacote "comum" iria contra a regra do projeto.
func internalError(w http.ResponseWriter, op string, err error) {
	slog.Error(op, "err", err)
	writeJSON(w, http.StatusInternalServerError, errorResponse{Error: "internal"})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		slog.Error("write json", "err", err)
	}
}

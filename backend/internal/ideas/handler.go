package ideas

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/jackc/pgx/v5"
)

const (
	maxBodyBytes = 64 << 10 // 64 KB
	previewSize  = 3        // quantas ideias o visitante vê (docs/contratos/fatia-3-cadastro.md)
)

// Listas fixas do contrato (docs/contratos/fatia-1-mural.md). O front mantém a mesma lista com os rótulos.
// Courses é exportada porque o cadastro (pacote auth) valida o curso do aluno contra a mesma lista.
var (
	Courses    = map[string]bool{"cc": true, "eng": true, "ads": true}
	categories = map[string]bool{
		"web": true, "mobile": true, "ai": true, "data": true, "games": true,
		"competitive_programming": true, "security": true, "iot": true, "other": true,
	}
	statuses = map[string]bool{"open": true, "in_progress": true, "done": true} // docs/contratos/fatia-7-status.md
)

type Handler struct {
	q *Queries
	// userID diz quem está logado (0 = visitante). Recebe uma função, não o pacote auth: os testes trocam por um stub.
	userID func(*http.Request) (int64, error)
}

func NewHandler(db DBTX, userID func(*http.Request) (int64, error)) *Handler {
	return &Handler{q: New(db), userID: userID}
}

// Corpo do POST e do PUT: postar e editar trocam os mesmos campos.
type ideaRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Course      string `json:"course"`
	Category    string `json:"category"`
	Slots       int    `json:"slots"`
}

// Corpo do PUT /status.
type statusRequest struct {
	Status string `json:"status"`
}

type authorResponse struct {
	ID        int64   `json:"id"`
	Name      string  `json:"name"`
	AvatarURL *string `json:"avatar_url"`
}

type ideaResponse struct {
	ID          int64          `json:"id"`
	Title       string         `json:"title"`
	Description string         `json:"description"`
	Course      string         `json:"course"`
	Category    string         `json:"category"`
	Slots       int32          `json:"slots"`
	Status      string         `json:"status"`
	Author      authorResponse `json:"author"`
	CreatedAt   time.Time      `json:"created_at"`
	DoneAt      *time.Time     `json:"done_at"` // quando foi concluída; null se não está concluída
	// Quantos marcaram "quero participar" e se quem pede é um deles.
	InterestCount int64 `json:"interest_count"`
	Interested    bool  `json:"interested"`
	// Só o autor recebe a lista. omitzero (Go 1.24+) tira só o nil: para quem não é autor o campo some,
	// e o autor sem interessados recebe [] (omitempty tiraria os dois).
	Interests []interestResponse `json:"interests,omitzero"`
}

// Mesmos campos, com os mesmos nomes, do ListInterestsRow gerado (por isso AvatarUrl, não AvatarURL): a conversão é direta.
type interestResponse struct {
	ID        int64   `json:"id"`
	Name      string  `json:"name"`
	AvatarUrl *string `json:"avatar_url"`
	DiscordID *string `json:"discord_id"`
}

type errorResponse struct {
	Error  string            `json:"error"`
	Fields map[string]string `json:"fields,omitempty"`
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	authorID, ok := h.loggedIn(w, r)
	if !ok {
		return
	}

	var req ideaRequest
	if !readBody(w, r, &req) {
		return
	}
	row, err := h.q.CreateIdea(r.Context(), CreateIdeaParams{
		AuthorID:    authorID,
		Title:       req.Title,
		Description: req.Description,
		Course:      req.Course,
		Category:    req.Category,
		Slots:       int32(req.Slots), // seguro: validate garante 1–20
	})
	if err != nil {
		internalError(w, "create idea", err)
		return
	}
	writeJSON(w, http.StatusCreated, toResponse(ListIdeasRow(row)))
}

// Update troca os campos da ideia (os mesmos do postar). Só o autor; status, autor e data não mudam por aqui.
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id, ok := h.authorOf(w, r)
	if !ok {
		return
	}
	var req ideaRequest
	if !readBody(w, r, &req) {
		return
	}
	row, err := h.q.UpdateIdea(r.Context(), UpdateIdeaParams{
		ID:          id,
		Title:       req.Title,
		Description: req.Description,
		Course:      req.Course,
		Category:    req.Category,
		Slots:       int32(req.Slots), // seguro: validate garante 1–20
	})
	if errors.Is(err, pgx.ErrNoRows) { // apagada entre o authorOf e aqui
		writeJSON(w, http.StatusNotFound, errorResponse{Error: "not_found"})
		return
	}
	if err != nil {
		internalError(w, "update idea", err)
		return
	}
	writeJSON(w, http.StatusOK, toResponse(ListIdeasRow(row)))
}

// Delete apaga a ideia de vez, e os interessados vão junto (ON DELETE CASCADE). Só o autor.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id, ok := h.authorOf(w, r)
	if !ok {
		return
	}
	if err := h.q.DeleteIdea(r.Context(), id); err != nil {
		internalError(w, "delete idea", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// SetStatus troca o status da ideia. Só o autor. Só ideia aberta recebe interessados (PutInterest),
// então trocar o status é também o jeito de travar ou destravar a lista.
func (h *Handler) SetStatus(w http.ResponseWriter, r *http.Request) {
	id, ok := h.authorOf(w, r)
	if !ok {
		return
	}
	var req statusRequest
	if !readBody(w, r, &req) {
		return
	}
	if err := h.q.SetIdeaStatus(r.Context(), SetIdeaStatusParams{ID: id, Status: req.Status}); err != nil {
		internalError(w, "set idea status", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// List devolve o mural (abertas e em andamento) ou, com ?status=done, a vitrine de concluídas.
// Tudo para quem está logado, só as primeiras para visitante.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	userID, err := h.userID(r)
	if err != nil {
		internalError(w, "session", err)
		return
	}
	var done bool
	switch r.URL.Query().Get("status") {
	case "": // o mural; em Go o case não cai no próximo, então vazio é "não faz nada"
	case "done":
		done = true
	default:
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "validation_failed", Fields: map[string]string{"status": "valor inválido"}})
		return
	}
	var max *int32 // nil vira NULL no SQL: sem limite
	if userID == 0 {
		max = new(int32(previewSize)) // Go 1.26+: new aceita um valor e devolve o ponteiro para uma cópia dele
	}
	rows, err := h.q.ListIdeas(r.Context(), ListIdeasParams{Viewer: userID, Done: done, Max: max})
	if err != nil {
		internalError(w, "list ideas", err)
		return
	}
	items := make([]ideaResponse, 0, len(rows)) // não-nil: lista vazia vira [] no JSON, não null
	for _, row := range rows {
		items = append(items, toResponse(row))
	}
	writeJSON(w, http.StatusOK, map[string][]ideaResponse{"items": items})
}

// Mine devolve todas as ideias de quem está logado, em qualquer status (a página "Minhas ideias").
func (h *Handler) Mine(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.loggedIn(w, r)
	if !ok {
		return
	}
	rows, err := h.q.ListMyIdeas(r.Context(), userID)
	if err != nil {
		internalError(w, "list my ideas", err)
		return
	}
	items := make([]ideaResponse, 0, len(rows)) // não-nil: lista vazia vira [] no JSON, não null
	for _, row := range rows {
		items = append(items, toResponse(ListIdeasRow(row)))
	}
	writeJSON(w, http.StatusOK, map[string][]ideaResponse{"items": items})
}

// Get devolve uma ideia, só para quem está logado: o visitante fica na prévia do mural.
// O autor recebe também a lista de interessados, com o discord_id para chamar cada um.
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.loggedIn(w, r)
	if !ok {
		return
	}
	id, ok := pathID(r)
	if !ok {
		writeJSON(w, http.StatusNotFound, errorResponse{Error: "not_found"})
		return
	}
	row, err := h.q.GetIdea(r.Context(), GetIdeaParams{ID: id, Viewer: userID})
	if errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusNotFound, errorResponse{Error: "not_found"})
		return
	}
	if err != nil {
		internalError(w, "get idea", err)
		return
	}
	resp := toResponse(ListIdeasRow(row))
	if row.AuthorID == userID {
		people, err := h.q.ListInterests(r.Context(), id)
		if err != nil {
			internalError(w, "list interests", err)
			return
		}
		resp.Interests = make([]interestResponse, 0, len(people)) // não-nil: o autor sem interessados recebe []
		for _, p := range people {
			resp.Interests = append(resp.Interests, interestResponse(p))
		}
	}
	writeJSON(w, http.StatusOK, resp)
}

// PutInterest é o "quero participar": sem aprovação, a pessoa entra direto na lista. Repetir não muda nada.
// Só ideia aberta recebe interessados.
func (h *Handler) PutInterest(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.loggedIn(w, r)
	if !ok {
		return
	}
	id, ok := pathID(r)
	if !ok {
		writeJSON(w, http.StatusNotFound, errorResponse{Error: "not_found"})
		return
	}
	idea, err := h.q.GetIdeaAuthor(r.Context(), id)
	if errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusNotFound, errorResponse{Error: "not_found"})
		return
	}
	if err != nil {
		internalError(w, "get idea author", err)
		return
	}
	if idea.AuthorID == userID {
		writeJSON(w, http.StatusConflict, errorResponse{Error: "own_idea"})
		return
	}
	if idea.Status != "open" { // em andamento ou concluída: a lista está travada
		writeJSON(w, http.StatusConflict, errorResponse{Error: "closed"})
		return
	}
	if err := h.q.AddInterest(r.Context(), AddInterestParams{IdeaID: id, UserID: userID}); err != nil {
		internalError(w, "add interest", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// DeleteInterest é o "desistir". Responde 204 mesmo sem interesse ou sem ideia: o resultado é o mesmo, a pessoa não está na lista.
func (h *Handler) DeleteInterest(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.loggedIn(w, r)
	if !ok {
		return
	}
	if id, ok := pathID(r); ok {
		if err := h.q.RemoveInterest(r.Context(), RemoveInterestParams{IdeaID: id, UserID: userID}); err != nil {
			internalError(w, "remove interest", err)
			return
		}
	}
	w.WriteHeader(http.StatusNoContent)
}

// loggedIn devolve quem está logado; sem sessão já responde 401 (ou 500 se a sessão falhou) e devolve ok = false.
func (h *Handler) loggedIn(w http.ResponseWriter, r *http.Request) (userID int64, ok bool) {
	userID, err := h.userID(r)
	if err != nil {
		internalError(w, "session", err)
		return 0, false
	}
	if userID == 0 {
		writeJSON(w, http.StatusUnauthorized, errorResponse{Error: "unauthenticated"})
		return 0, false
	}
	return userID, true
}

// authorOf devolve o id da ideia da rota quando quem chama é o autor dela. Senão já responde
// 401 (sem sessão), 404 (ideia não existe) ou 403 (não é o autor) e devolve ok = false.
func (h *Handler) authorOf(w http.ResponseWriter, r *http.Request) (id int64, ok bool) {
	userID, ok := h.loggedIn(w, r)
	if !ok {
		return 0, false
	}
	id, ok = pathID(r)
	if !ok {
		writeJSON(w, http.StatusNotFound, errorResponse{Error: "not_found"})
		return 0, false
	}
	idea, err := h.q.GetIdeaAuthor(r.Context(), id)
	if errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusNotFound, errorResponse{Error: "not_found"})
		return 0, false
	}
	if err != nil {
		internalError(w, "get idea author", err)
		return 0, false
	}
	if idea.AuthorID != userID {
		writeJSON(w, http.StatusForbidden, errorResponse{Error: "not_author"})
		return 0, false
	}
	return id, true
}

// pathID lê o {id} da rota. Id que não é inteiro positivo é só uma ideia que não existe: quem chama responde 404 sem ir ao banco.
func pathID(r *http.Request) (int64, bool) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	return id, err == nil && id > 0
}

// validator é todo corpo de requisição que sabe se limpar e se validar (ideaRequest, statusRequest).
// Em Go a interface é implícita: basta o tipo ter o método validate, sem declarar que a implementa.
type validator interface {
	validate() map[string]string
}

// readBody lê o corpo JSON em req (um ponteiro) e valida. Com erro, já responde 400 ou 413 e devolve false.
func readBody(w http.ResponseWriter, r *http.Request, req validator) bool {
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxBodyBytes)).Decode(req); err != nil {
		var tooBig *http.MaxBytesError
		if errors.As(err, &tooBig) {
			writeJSON(w, http.StatusRequestEntityTooLarge, errorResponse{Error: "body_too_large"})
			return false
		}
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "invalid_json"})
		return false
	}
	if fields := req.validate(); len(fields) > 0 {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "validation_failed", Fields: fields})
		return false
	}
	return true
}

// validate limpa os campos de texto (trim) e devolve os erros por campo; vazio = válido.
func (req *ideaRequest) validate() map[string]string {
	req.Title = strings.TrimSpace(req.Title)
	req.Description = strings.TrimSpace(req.Description)
	req.Course = strings.TrimSpace(req.Course)
	req.Category = strings.TrimSpace(req.Category)

	fields := map[string]string{}
	checkText(fields, "title", req.Title, 3, 120)
	checkText(fields, "description", req.Description, 1, 5000)
	CheckOption(fields, "course", req.Course, Courses)
	CheckOption(fields, "category", req.Category, categories)
	if req.Slots < 1 || req.Slots > 20 {
		fields["slots"] = "deve ser entre 1 e 20"
	}
	return fields
}

func (req *statusRequest) validate() map[string]string {
	req.Status = strings.TrimSpace(req.Status)
	fields := map[string]string{}
	CheckOption(fields, "status", req.Status, statuses)
	return fields
}

func checkText(fields map[string]string, name, v string, minLen, maxLen int) {
	n := utf8.RuneCountInString(v) // caracteres, não bytes: "ação" tem 4
	switch {
	case n == 0:
		fields[name] = "obrigatório"
	case strings.ContainsRune(v, 0):
		fields[name] = "contém caractere inválido"
	case n < minLen || n > maxLen:
		fields[name] = fmt.Sprintf("deve ter entre %d e %d caracteres", minLen, maxLen)
	}
}

// CheckOption grava em fields o erro de um valor que precisa estar na lista; exportada para o cadastro usar as mesmas mensagens.
func CheckOption(fields map[string]string, name, v string, allowed map[string]bool) {
	switch {
	case v == "":
		fields[name] = "obrigatório"
	case !allowed[v]:
		fields[name] = "valor inválido"
	}
}

func toResponse(r ListIdeasRow) ideaResponse {
	return ideaResponse{
		ID:            r.ID,
		Title:         r.Title,
		Description:   r.Description,
		Course:        r.Course,
		Category:      r.Category,
		Slots:         r.Slots,
		Status:        r.Status,
		Author:        authorResponse{ID: r.AuthorID, Name: r.AuthorName, AvatarURL: r.AuthorAvatarUrl},
		CreatedAt:     r.CreatedAt.UTC(),
		DoneAt:        utc(r.DoneAt),
		InterestCount: r.InterestCount,
		Interested:    r.Interested,
	}
}

// utc devolve a data em UTC, como o created_at; nil continua nil (vira null no JSON).
func utc(t *time.Time) *time.Time {
	if t == nil {
		return nil
	}
	return new(t.UTC())
}

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

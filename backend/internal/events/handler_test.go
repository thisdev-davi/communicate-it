package events

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// loggedAs troca a sessão de verdade por um usuário fixo (0 = visitante).
func loggedAs(id int64) func(*http.Request) (int64, error) {
	return func(*http.Request) (int64, error) { return id, nil }
}

func do(t *testing.T, hf http.HandlerFunc, method, body string) *httptest.ResponseRecorder {
	t.Helper()
	rec := httptest.NewRecorder()
	hf(rec, httptest.NewRequest(method, "/api/events", strings.NewReader(body)))
	return rec
}

func decode[T any](t *testing.T, rec *httptest.ResponseRecorder) T {
	t.Helper()
	var v T
	if err := json.Unmarshal(rec.Body.Bytes(), &v); err != nil {
		t.Fatalf("resposta não é JSON: %v (%s)", err, rec.Body)
	}
	return v
}

// body monta um corpo válido com starts_at trocável.
func body(startsAt string) string {
	return `{"title":"Noite de trabalho","description":"Traga o notebook","starts_at":"` + startsAt + `","location":"Bloco B, sala 204"}`
}

func future(d time.Duration) string { return time.Now().Add(d).Format(time.RFC3339) }

// Esses casos param antes do banco, então o handler roda sem conexão (nil).
func TestCreateRejectsBadInput(t *testing.T) {
	cases := []struct {
		name       string
		authorID   int64
		body       string
		wantStatus int
		wantError  string
		wantFields []string
	}{
		{"sem sessão", 0, body(future(time.Hour)), 401, "unauthenticated", nil},
		{"json malformado", 1, `{`, 400, "invalid_json", nil},
		{"corpo grande", 1, `{"title":"` + strings.Repeat("a", maxBodyBytes) + `"}`, 413, "body_too_large", nil},
		{"tudo vazio", 1, `{}`, 400, "validation_failed", []string{"title", "description", "starts_at", "location"}},
		{"local só espaços", 1, `{"title":"abc","description":"x","starts_at":"` + future(time.Hour) + `","location":"   "}`, 400, "validation_failed", []string{"location"}},
		{"data sem fuso", 1, body("2099-10-20T19:00:00"), 400, "validation_failed", []string{"starts_at"}},
		{"data com tipo errado", 1, `{"starts_at":20}`, 400, "invalid_json", nil},
		{"data no passado", 1, body(future(-time.Minute)), 400, "validation_failed", []string{"starts_at"}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			rec := do(t, NewHandler(nil, loggedAs(tc.authorID)).Create, http.MethodPost, tc.body)
			if rec.Code != tc.wantStatus {
				t.Fatalf("status = %d, quer %d (%s)", rec.Code, tc.wantStatus, rec.Body)
			}
			got := decode[errorResponse](t, rec)
			if got.Error != tc.wantError {
				t.Errorf("error = %q, quer %q", got.Error, tc.wantError)
			}
			if len(got.Fields) != len(tc.wantFields) {
				t.Errorf("fields = %v, quer só %v", got.Fields, tc.wantFields)
			}
			for _, f := range tc.wantFields {
				if got.Fields[f] == "" {
					t.Errorf("faltou erro no campo %q: %v", f, got.Fields)
				}
			}
		})
	}
}

// "No futuro" é estrito: o mesmo instante de agora já é recusado.
func TestValidateFuture(t *testing.T) {
	now := time.Date(2026, 10, 20, 22, 0, 0, 0, time.UTC)
	for startsAt, want := range map[string]string{
		"2026-10-20T19:00:00-03:00": "deve ser no futuro", // é o próprio now, escrito no horário de Brasília
		"2026-10-20T19:00:01-03:00": "",
	} {
		req := eventRequest{Title: "abc", Description: "x", Location: "abc", StartsAt: startsAt}
		if got := req.validate(now)["starts_at"]; got != want {
			t.Errorf("%s: erro = %q, quer %q", startsAt, got, want)
		}
	}
}

func TestSessionErrorIs500(t *testing.T) {
	failing := func(*http.Request) (int64, error) { return 0, errors.New("banco fora") }
	rec := do(t, NewHandler(nil, failing).Create, http.MethodPost, body(future(time.Hour)))
	if rec.Code != 500 || decode[errorResponse](t, rec).Error != "internal" {
		t.Errorf("status = %d (%s), quer 500 internal", rec.Code, rec.Body)
	}
}

// Caminho feliz contra Postgres real. Precisa de TEST_DATABASE_URL apontando para um banco já migrado.
func TestCreateAndList(t *testing.T) {
	pool := testDB(t)
	ctx := context.Background()
	var authorID int64
	if err := pool.QueryRow(ctx, "INSERT INTO users (name) VALUES ('Organizador de Teste') RETURNING id").Scan(&authorID); err != nil {
		t.Fatal(err)
	}
	h := NewHandler(pool, loggedAs(authorID))

	rec := do(t, h.List, http.MethodGet, "")
	if rec.Code != 200 || strings.TrimSpace(rec.Body.String()) != `{"items":[]}` {
		t.Fatalf("lista vazia: %d %s", rec.Code, rec.Body)
	}

	// Criados fora de ordem: a agenda devolve do mais próximo para o mais distante.
	later := time.Now().Add(48 * time.Hour).Truncate(time.Second)
	rec = do(t, h.Create, http.MethodPost, `{"title":"  Hackathon  ","description":"Fim de semana","starts_at":"`+later.Format(time.RFC3339)+`","location":"Bloco H"}`)
	if rec.Code != 201 {
		t.Fatalf("status = %d (%s)", rec.Code, rec.Body)
	}
	far := decode[eventResponse](t, rec)
	if far.Title != "Hackathon" || !far.StartsAt.Equal(later) || far.Author.Name != "Organizador de Teste" || far.CreatedAt.IsZero() {
		t.Errorf("evento criado inesperado: %+v", far)
	}
	if rec = do(t, h.Create, http.MethodPost, body(future(time.Hour))); rec.Code != 201 {
		t.Fatalf("segundo POST: %d (%s)", rec.Code, rec.Body)
	}
	near := decode[eventResponse](t, rec)

	// Um evento de ontem (só dá para gravar direto no banco) não aparece na agenda.
	if _, err := pool.Exec(ctx, "INSERT INTO events (author_id, title, description, starts_at, location) VALUES ($1, 'Passado', 'x', now() - interval '1 day 1 hour', 'abc')", authorID); err != nil {
		t.Fatal(err)
	}

	// O visitante vê a mesma agenda que o logado.
	for name, viewer := range map[string]int64{"logado": authorID, "visitante": 0} {
		list := decode[struct{ Items []eventResponse }](t, do(t, NewHandler(pool, loggedAs(viewer)).List, http.MethodGet, "")).Items
		if len(list) != 2 || list[0].ID != near.ID || list[1].ID != far.ID {
			t.Errorf("%s: quer [%d %d], veio %+v", name, near.ID, far.ID, list)
		}
	}
}

// testDB conecta no banco de teste com as tabelas vazias; pula o teste sem TEST_DATABASE_URL.
func testDB(t *testing.T) *pgxpool.Pool {
	t.Helper()
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("TEST_DATABASE_URL não definida")
	}
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(pool.Close)
	lockDB(t, pool)
	// CASCADE limpa também o que aponta para users (ideias, sessões).
	if _, err := pool.Exec(ctx, "TRUNCATE events, users RESTART IDENTITY CASCADE"); err != nil {
		t.Fatal(err)
	}
	return pool
}

// lockDB segura o mesmo advisory lock dos testes de ideas: os pacotes rodam em paralelo e limpam as mesmas tabelas.
func lockDB(t *testing.T, pool *pgxpool.Pool) {
	t.Helper()
	ctx := context.Background()
	conn, err := pool.Acquire(ctx) // o lock pertence à conexão, então ela fica reservada até o fim
	if err != nil {
		t.Fatal(err)
	}
	if _, err := conn.Exec(ctx, "SELECT pg_advisory_lock(1)"); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		conn.Exec(ctx, "SELECT pg_advisory_unlock(1)")
		conn.Release()
	})
}

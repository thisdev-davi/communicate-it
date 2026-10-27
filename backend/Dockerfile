FROM golang:1.27-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# CGO desligado: binário estático, roda no alpine sem as libs de C do Go
RUN CGO_ENABLED=0 go build -o /api ./cmd/api

# As migrations não moram aqui: rodam no job deploy do GitHub Actions, antes desta imagem subir no Render.
# O alpine já traz os certificados para falar com o Discord e com o Neon.
FROM alpine:3.22
COPY --from=build /api /api
USER nobody
EXPOSE 8090
CMD ["/api"]

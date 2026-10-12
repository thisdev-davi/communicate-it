#!/bin/sh
# Deploy na VPS. É o único comando que a chave do GitHub Actions consegue rodar: o authorized_keys
# do usuário deploy força `cd /opt/comunica-faesa && git pull --ff-only -q && exec sh deploy.sh`.
# O pull fica lá, antes deste arquivo, para que uma mudança aqui já valha no mesmo deploy.
# Sem rollback: se o build falhar, o set -e para aqui e os containers antigos continuam no ar.
set -eu
docker compose -f compose.prod.yaml build
docker compose -f compose.prod.yaml up -d
# só as imagens velhas do Comunica; um prune sem filtro apagaria as dos outros projetos da VPS
docker image prune -f --filter label=com.docker.compose.project=comunica

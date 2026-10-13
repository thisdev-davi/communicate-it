#!/bin/sh
# Deploy na VPS. Este arquivo é só a referência versionada: o que roda é a cópia em /opt/comunica-faesa, do root,
# copiada à mão (ver README "Deploy na VPS"). Assim, uma mudança na main não muda o que a chave do deploy executa.
# A chave do GitHub Actions só consegue rodar o command= do authorized_keys do usuário deploy:
#   cd /opt/comunica-faesa/app && git pull --ff-only -q && exec sh /opt/comunica-faesa/deploy.sh
# Sem rollback: se o build falhar, o set -e para aqui e os containers antigos continuam no ar.
set -eu
cd /opt/comunica-faesa
docker compose -f compose.prod.yaml build
docker compose -f compose.prod.yaml up -d
# só as imagens velhas do Comunica; um prune sem filtro apagaria as dos outros projetos da VPS
docker image prune -f --filter label=com.docker.compose.project=comunica

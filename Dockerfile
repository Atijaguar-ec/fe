FROM node:22-alpine as base-stage
RUN apk add --update git
RUN npm install -g npm@10
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
# 4 GB de heap, no 8: el agente de Jenkins de Fortaleza tiene 7,8 GB en total y
# ademas hospeda el propio Jenkins y el stack de staging. Con el techo en 8192
# este build agotaba la maquina y el kernel mataba a Jenkins por OOM a mitad de
# la compilacion — ocurrio el 2026-09-08 en el despliegue a produccion, que
# quedo registrado como SUCCESS pese a fallar. 4096 sobra para este build y deja
# margen al resto. Si alguna vez falla con "JavaScript heap out of memory", el
# problema es el tamano del bundle, no este techo.
ENV NODE_OPTIONS="--max_old_space_size=4096"

# Build target para cacao (standalone, sin remotes de camarón)
FROM base-stage as build-cacao
RUN npm run build:standalone

# Build target para camarón (completo, integrando shrimpMfe)
FROM base-stage as build-shrimp
RUN npm run build:prod

# Variante 1: Cacao puro sin remotes (fe-inatrace:cacao)
FROM nginx:stable-alpine as cacao
RUN mkdir /app
COPY --from=build-cacao /app/dist/apps/inatrace-fe /app
COPY nginx.conf /etc/nginx/nginx.conf
CMD ["/bin/sh",  "-c",  "envsubst < /app/assets/env.template.js > /app/assets/env.js && exec nginx -g 'daemon off;'"]

# Variante 2: Camarón integrado (fe-inatrace:shrimp)
FROM nginx:stable-alpine as shrimp
RUN mkdir /app
COPY --from=build-shrimp /app/dist/apps/inatrace-fe /app
COPY --from=build-shrimp /app/dist/shrimpMfe /app/shrimpMfe
COPY nginx.conf /etc/nginx/nginx.conf
CMD ["/bin/sh",  "-c",  "envsubst < /app/assets/env.template.js > /app/assets/env.js && exec nginx -g 'daemon off;'"]

# Default: producción completa con retrocompatibilidad
FROM shrimp as production-stage

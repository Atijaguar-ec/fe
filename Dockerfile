FROM node:22-alpine as build-stage
RUN apk add --update git
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
# For Nx monorepo, we just use build:prod
ENV NODE_OPTIONS="--max_old_space_size=8192"
RUN npm run build:prod

FROM nginx:stable-alpine as production-stage
RUN mkdir /app
# Overwrite with Nx monorepo dist directory
COPY --from=build-stage /app/dist/apps/inatrace-fe /app
COPY nginx.conf /etc/nginx/nginx.conf

# Serve using dynamic envsubst
CMD ["/bin/sh",  "-c",  "envsubst < /app/assets/env.template.js > /app/assets/env.js && exec nginx -g 'daemon off;'"]

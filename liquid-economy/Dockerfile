# ---- builder ----
FROM node:22-alpine AS builder

WORKDIR /app

# Install deps first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Pass API base URL as a build arg so Coolify can override it
ARG VITE_API_BASE_URL=https://api.dovizveri.com/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .
RUN npm run build


# ---- runtime ----
FROM nginx:1.27-alpine AS runtime

# wget needed for the HEALTHCHECK (not included in nginx:alpine by default)
RUN apk add --no-cache wget

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

# Rendered at container start: nginx:alpine runs envsubst on
# /etc/nginx/templates/*.template → /etc/nginx/conf.d/ using only the
# variables listed below, so we don't accidentally eat nginx's own $vars.
COPY nginx.conf /etc/nginx/templates/default.conf.template
ENV NGINX_ENVSUBST_FILTER_VARIABLES="TRACKER_API_KEY"

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]

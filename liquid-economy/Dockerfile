# ---- builder ----
FROM node:22-alpine AS builder

WORKDIR /app

# Install deps first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build


# ---- runtime ----
FROM nginx:1.27-alpine AS runtime

# wget needed for the HEALTHCHECK (not included in nginx:alpine by default)
RUN apk add --no-cache wget

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/healthz || exit 1

# Entrypoint fills in ${FINANCE_API_UPSTREAM} and ${FINANCE_API_KEY} from
# runtime env vars (set in Coolify), then starts nginx.
ENTRYPOINT ["/docker-entrypoint.sh"]

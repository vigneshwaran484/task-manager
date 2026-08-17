# ────────────────────────────────────────────────────────────────────────────
# Stage 1 — Builder
# ────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
# We use npm ci for deterministic, reproducible builds (supply chain security)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the Vite application for production
RUN npm run build

# ────────────────────────────────────────────────────────────────────────────
# Stage 2 — Runtime
# ────────────────────────────────────────────────────────────────────────────
# Use nginx unprivileged to avoid running the web server as root (CIS benchmark)
FROM nginxinc/nginx-unprivileged:1.25-alpine AS runtime

# Copy custom Nginx configuration if needed (e.g. for React Router HTML5 History)
# We will create an nginx.conf to handle this and inject security headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the static assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose the default unprivileged port
EXPOSE 8080

# Health check to ensure Nginx is serving traffic
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]

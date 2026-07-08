# Multi-stage build per docs/architecture.md §2/§3:
# build SPA -> build backend -> slim runtime serving both on one origin.

# ---- Stage 1: build the SPA ----
FROM node:22-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: build the backend ----
FROM node:22-alpine AS backend-build
WORKDIR /backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

# ---- Stage 3: runtime ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY backend/package.json backend/package-lock.json ./
# Production deps plus the prisma CLI (a devDependency), which the container
# needs at boot for `prisma migrate deploy` — the entire DB init path.
RUN npm ci --omit=dev && npm install --no-save prisma@6.19.3
COPY backend/prisma ./prisma
COPY --from=backend-build /backend/dist ./dist
COPY --from=frontend-build /frontend/dist ./public
ENV STATIC_DIR=/app/public
ENV PORT=8080
EXPOSE 8080
USER node
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]

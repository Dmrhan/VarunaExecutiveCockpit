# ─── Stage 1: Builder ──────────────────────────────────────────────────────────
# node-gyp için build tools gerekli (deasync native addon)
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ─── Stage 2: Production Runner (MSSQL) ────────────────────────────────────────
FROM node:20-alpine AS production

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
# Production dependencies only (includes mssql + deasync)
RUN npm ci --omit=dev

# Copy compiled JS from builder
COPY --from=builder /app/dist ./dist

# Copy schema files (needed by adapters at runtime)
# Use RUN to ensure target dir exists, then COPY individual files
RUN mkdir -p ./dist/db
COPY src/db/schema.sql ./dist/db/schema.sql

EXPOSE 3001

ENV NODE_ENV=production
ENV DB_DRIVER=mssql

CMD ["node", "dist/index.js"]

# ─── Stage 3: Development Runner (SQLite) ──────────────────────────────────────
FROM node:20-alpine AS development

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

# SQLite DB stored in mounted volume: -v ./data:/app/data
RUN mkdir -p /app/data

EXPOSE 3001

ENV NODE_ENV=development
ENV DB_DRIVER=sqlite

CMD ["npm", "run", "dev"]

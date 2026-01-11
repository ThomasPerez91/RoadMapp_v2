FROM node:22.16.0-alpine3.22 AS base

# ================================
# 1) INSTALL DEPENDENCIES
# ================================
FROM base AS deps
WORKDIR /app
ADD package.json package-lock.json ./
RUN npm ci

# ================================
# 2) INSTALL PRODUCTION DEPENDENCIES
# ================================
FROM base AS production-deps
WORKDIR /app
ADD package.json package-lock.json ./
RUN npm ci --omit=dev

# ================================
# 3) BUILD THE APPLICATION
# ================================
FROM base AS build
WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules
ADD . .

# Build Adonis (TS + Vite SSR + Client)
RUN node ace build

# ================================
# 4) FINAL IMAGE (runtime only)
# ================================
FROM base
ENV NODE_ENV=production
WORKDIR /app

# Only keep production deps
COPY --from=production-deps /app/node_modules /app/node_modules

# Copy the production build
COPY --from=build /app/build /app

EXPOSE 8080

CMD ["node", "./bin/server.js"]

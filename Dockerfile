# 1️⃣ Etapa de construcción
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias del sistema necesarias para Prisma
RUN apk add --no-cache openssl

# Copiar solo archivos de dependencias para optimizar la cache
COPY package.json package-lock.json prisma/schema.prisma ./

# Instalar dependencias (incluyendo devDependencies)
RUN npm ci

# Generar Prisma Client
RUN npx prisma generate

# Copiar el resto del código fuente
COPY . .

# Compilar la aplicación
RUN npm run build

# 2️⃣ Etapa de producción
FROM node:20-alpine AS runner

WORKDIR /app

# Instalar solo dependencias de producción si fuera necesario
RUN apk add --no-cache openssl

# Crear usuario no-root para mayor seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs

# Copiar desde builder
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Cambiar a usuario no-root
USER nodejs

# Exponer el puerto
EXPOSE 3000

# Health check opcional
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/health || exit 1

# Ejecutar migraciones y luego iniciar la app (en producción)
CMD npx prisma migrate deploy && node dist/main.js
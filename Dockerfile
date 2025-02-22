# Etapa 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package.json y lockfile antes de instalar dependencias
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copiar el resto del código y compilar
COPY . .
RUN npm run build

# Etapa 2: Producción
FROM node:18-alpine AS runner

WORKDIR /app

# Copiar archivos necesarios de la etapa de build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Instalar solo Prisma Client en producción
RUN npx prisma generate

# Exponer el puerto de la aplicación
EXPOSE 3000

# Comando de inicio
CMD ["node", "dist/main"]

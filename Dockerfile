# 1️⃣ Etapa de construcción
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias del sistema necesarias para Prisma
RUN apk add --no-cache libc6-compat

# Copiar solo archivos de dependencias para optimizar la cache
COPY package.json package-lock.json ./

# Instalar dependencias
RUN npm install

# Copiar el código fuente
COPY . .

# Generar Prisma Client antes de compilar
RUN npx prisma generate
RUN npx prisma migrate deploy
# Compilar la aplicación
RUN npm run build

# 2️⃣ Etapa de producción
FROM node:20-alpine AS runner

WORKDIR /app

# Copiar solo lo necesario desde la etapa de construcción
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Exponer el puerto
EXPOSE 3000

# Ejecutar migraciones antes de iniciar la app
CMD ["node", "dist/main.js"]

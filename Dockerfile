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
CMD npx prisma migrate deploy && node dist/main
  
  # En este Dockerfile, dividimos la construcción de la imagen en dos etapas. La primera etapa, llamada  builder , se utiliza para instalar dependencias, compilar la aplicación y generar el cliente de Prisma. La segunda etapa, llamada  runner , se utiliza para copiar solo los archivos necesarios desde la etapa de construcción y ejecutar la aplicación. 
  # Para construir la imagen, ejecuta el siguiente comando: 
  # docker build -t myapp .
  
  # Una vez que la imagen se haya construido, puedes ejecutar un contenedor con el siguiente comando: 
  # docker run -p 3000:3000 myapp
  
  # Ahora, tu aplicación debería estar en funcionamiento en  http://localhost:3000 . 
  # Conclusión 
  # En este tutorial, aprendiste cómo implementar una aplicación de Node.js con Prisma en Docker. Primero, configuraste una aplicación de Node.js con Prisma y luego la empaquetaste en un contenedor Docker. 
  # Si deseas aprender más sobre Docker, consulta nuestra  Guía de Docker. 
  # Si deseas aprender más sobre Prisma, consulta nuestra  Guía de Prisma. 
  # ¡Gracias por leer! 
  # Prisma es una base de datos ORM (Object-Relational Mapping) para Node.js y TypeScript. Proporciona una interfaz de programación de aplicaciones (API) para interactuar con una base de datos relacional. Prisma admite bases de datos como PostgreSQL, MySQL y SQLite. 
  # Docker es una plataforma de software que permite a los desarrolladores empaquetar, enviar y ejecutar aplicaciones en contenedores. Los contenedores son entornos aislados que contienen todo lo necesario para ejecutar una aplicación, incluidas las dependencias, las bibliotecas y el código. 
  # Un contenedor Docker es un entorno aislado que contiene una aplicación y todas sus dependencias, incluidas las bibliotecas y los archivos de configuración. Los contenedores se ejecutan en un host y comparten el núcleo del sistema operativo con otros contenedores. 
  # Un Dockerfile es un archivo de configuración que se utiliza para construir una imagen de Docker. El Dockerfile especifica los comandos necesarios para construir la imagen, como la instalación de dependencias, la copia de archivos y la configuración del entorno.
  # Dockerfile es un archivo de configuración que se utiliza para construir una imagen de Docker. El Dockerfile especifica los comandos necesarios para construir la imagen, como la instalación de dependencias, la copia de archivos y la configuración del entorno.    
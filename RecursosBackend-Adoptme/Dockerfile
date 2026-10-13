# Usamos una imagen base de NodeJS
FROM node:alpine

# Establecemos un directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos el paquete de dependencias del proyecto (package.json y package-lock.json)
COPY package*.json ./

# Ejecutar la instalacion de las dependencias del proyecto en el contenedor.
RUN npm install

# Copiamos el proyecto adentro de /app, conservando la carpeta src que usa npm start
COPY ./src ./src

# Exponer el puerto 8080 del contenedor para la aplicacion
EXPOSE 8080

# Definimos el comando que ejecuta la aplicacion
CMD ["npm", "run", "start"]

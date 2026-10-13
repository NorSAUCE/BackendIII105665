# Docker y Kubernetes

En esta guia vamos a ver como preparar la aplicacion para ejecutarla en un contenedor Docker y como publicar ese contenedor en Kubernetes. La idea es seguir el recorrido completo: primero se arma la imagen, despues Kubernetes crea los Pods y por ultimo un Service permite llegar a ellos.

## 1. El Dockerfile

El Dockerfile indica los pasos para construir la imagen de la aplicacion. Una imagen es como una plantilla: a partir de ella Docker crea contenedores con el codigo y las dependencias que necesita el backend.

```dockerfile
FROM node:alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY ./src ./src
EXPOSE 8080
CMD ["npm", "run", "start"]
```

### Que hace cada instruccion

- `FROM node:alpine`: parte de una imagen que ya tiene Node.js. `alpine` es una distribucion Linux pequeña, por eso la imagen suele ocupar menos espacio.
- `WORKDIR /app`: define `/app` como la carpeta de trabajo dentro del contenedor. Las instrucciones siguientes se ejecutan desde ahi.
- `COPY package*.json ./`: copia `package.json` y, si existe, `package-lock.json` desde la carpeta usada como contexto de construccion hasta `/app`. El archivo de dependencias se copia antes que el codigo para poder instalar los paquetes que necesita el proyecto.
- `RUN npm install`: instala las dependencias declaradas por el proyecto dentro de la imagen.
- `COPY ./src ./src`: copia el codigo fuente dentro de `/app/src`.
- `EXPOSE 8080`: deja documentado que la aplicacion atiende en el puerto `8080` del contenedor. Esta instruccion por si sola no publica el puerto en la computadora; esa comunicacion se configura con Kubernetes en este ejemplo.
- `CMD ["npm", "run", "start"]`: indica el comando que se ejecuta cuando arranca el contenedor. En `package.json`, el script `start` ejecuta `node src/app.js`.

### Por que se corrigio la copia de `src`

El script `start` busca el archivo `src/app.js`. Antes, el Dockerfile copiaba el contenido de `src` directamente a `/app`. Eso dejaba el archivo como `/app/app.js`, pero Node intentaba abrir `/app/src/app.js`. El resultado era un error de archivo no encontrado y el contenedor terminaba.

Al usar `COPY ./src ./src`, se conserva la carpeta y la ruta queda como `/app/src/app.js`, que coincide con lo que ejecuta `npm start`.

### Por que se cambio el puerto a 8080

En `src/app.js` la aplicacion define `const PORT = process.env.PORT || 8080`. Si no se configura la variable `PORT`, Express escucha en el puerto `8080`. Por eso el Dockerfile y Kubernetes deben describir ese mismo puerto. Si cada parte usa un numero distinto, el contenedor puede estar funcionando y aun asi el trafico puede enviarse a un puerto donde no hay ningun servidor.

## 2. El manifiesto de Kubernetes

El archivo `k8s-deployment.yaml` contiene dos recursos separados por `---`: un `Deployment` y un `Service`.

### Deployment: crear y mantener los Pods

Un Pod es la unidad en la que Kubernetes ejecuta uno o varios contenedores relacionados. El Deployment describe como deben ser esos Pods y se ocupa de mantener la cantidad deseada.

En este manifiesto:

- `apiVersion: apps/v1` y `kind: Deployment` identifican el tipo de recurso.
- `metadata.name: adopt-me` es el nombre del Deployment.
- `spec.replicas: 2` pide dos Pods. Kubernetes intenta mantener dos copias disponibles para repartir solicitudes y tolerar la caida de una de ellas.
- `spec.selector.matchLabels` dice que el Deployment administra Pods que tengan la etiqueta `app: backend-adoptme`.
- `spec.template` es la plantilla usada para crear cada Pod. Sus `metadata.labels` tienen que coincidir con el selector anterior.
- `containers` describe el contenedor del Pod. `image: backend-adoptme:latest` es la imagen que Kubernetes debe ejecutar.
- `containerPort: 8080` documenta el puerto que usa el proceso dentro del contenedor.

El nombre de etiqueta tiene que coincidir en el selector y en la plantilla. Si no coincide, el Deployment no puede reconocer sus propios Pods correctamente. Las etiquetas funcionan como nombres de referencia para que los recursos se encuentren entre si.

### Service: encontrar los Pods y recibir trafico

Los Pods pueden reemplazarse y sus direcciones internas pueden cambiar. El Service ofrece un punto de acceso estable y distribuye las solicitudes entre los Pods que coinciden con su selector.

- `kind: Service` crea ese punto de acceso.
- `type: NodePort` solicita que Kubernetes publique el Service en un puerto de los nodos del cluster, para poder acceder desde fuera del cluster usando la direccion del nodo y ese puerto.
- `selector: app: backend-adoptme` busca Pods con esa etiqueta. Debe coincidir con `spec.template.metadata.labels` del Deployment.
- `port: 8080` es el puerto que ofrece el Service dentro del cluster.
- `targetPort: http` indica a que puerto de cada Pod debe reenviar el trafico. `http` es el nombre asignado al `containerPort` del contenedor. Tambien se podria escribir directamente `targetPort: 8080`.
- `nodePort: 30080` es el puerto externo del nodo elegido en este ejemplo.

El camino de una solicitud es: cliente -> puerto `30080` del nodo -> Service en el puerto `8080` -> puerto `http` (8080) de uno de los Pods.

## 3. Que fallaba en la configuracion anterior

Habia varios valores que no estaban conectados entre si:

1. **El selector del Service no encontraba los Pods.** El Deployment creaba Pods con `app: backend-adoptme`, pero el Service buscaba `app: RecursosBackend-Adoptme`. Como no habia coincidencia, el Service se quedaba sin destinos y no podia enviar las solicitudes a la aplicacion.
2. **El puerto del contenedor no era el de la aplicacion.** El manifiesto indicaba `3000`, mientras que `src/app.js` escucha por defecto en `8080`. El Service podia intentar reenviar trafico a un puerto sin servidor.
3. **El NodePort `3001` no era valido en la configuracion predeterminada.** Kubernetes normalmente reserva para NodePort el rango `30000` a `32767`. Al pedir `3001`, la creacion del Service puede ser rechazada. En el manifiesto corregido se usa `30080`, que esta dentro del rango habitual.
4. **La ruta del archivo de inicio no coincidia con la copia del Dockerfile.** El comando `npm start` busca `src/app.js`, pero la copia anterior dejaba el archivo en otra ubicacion. El contenedor podia finalizar antes de que Kubernetes tuviera una aplicacion disponible.

Tambien es importante distinguir dos situaciones: si el YAML tiene un error de configuracion, Kubernetes puede rechazar el recurso; si acepta el Deployment pero el proceso del contenedor falla, los Pods pueden reiniciarse continuamente. Y aunque los Pods esten ejecutandose, un selector incorrecto puede dejar al Service sin endpoints.

## 4. Construir y desplegar

Ejecutar los comandos desde la carpeta `RecursosBackend-Adoptme`, porque ahi estan el Dockerfile, `package.json` y el manifiesto:

```bash
docker build -t backend-adoptme:latest .
kubectl apply -f k8s-deployment.yaml
```

La imagen se construye en Docker con la etiqueta `backend-adoptme:latest`. Para que Kubernetes la use, esa imagen tiene que estar disponible en los nodos del cluster. En un cluster local, dependiendo de la herramienta, puede hacer falta cargar la imagen en el cluster. En un cluster remoto, normalmente se publica en un registro de imagenes y se configura en el manifiesto la ruta completa de esa imagen.

`imagePullPolicy: IfNotPresent` indica que Kubernetes use la imagen que ya tenga disponible localmente y que solo intente descargarla si no esta presente. Esto es util al trabajar con una imagen local, pero no carga ni distribuye por si mismo la imagen a los nodos.

Para revisar si los recursos quedaron creados y si los Pods estan listos:

```bash
kubectl get deployments
kubectl get pods
kubectl get services
```

En un cluster donde la direccion del nodo sea accesible desde tu computadora, se puede probar el backend usando `http://<IP-DEL-NODO>:30080`. En herramientas locales como Minikube, la forma de obtener una direccion accesible puede depender de la configuracion del cluster.

## 5. Ideas importantes para recordar

- Docker prepara y ejecuta la aplicacion dentro de una imagen y un contenedor.
- El Deployment mantiene la cantidad deseada de Pods.
- El Service encuentra Pods usando etiquetas y les envia el trafico.
- El puerto de la aplicacion, el puerto del contenedor y los puertos del Service tienen funciones distintas, pero deben conectarse correctamente.
- Las etiquetas y los selectores deben coincidir exactamente.
- Construir una imagen local no significa automaticamente que todos los nodos de Kubernetes puedan verla.

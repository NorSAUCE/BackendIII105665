# Clase 6: pruebas para AdoptMe

En esta clase vamos a probar el backend con **Mocha**, **Chai** y **Supertest**. La meta es comprobar tanto piezas pequeñas como el recorrido de una solicitud por la aplicación.

## Objetivos

Al terminar, vas a poder:

- escribir pruebas unitarias para funciones, DTOs, controladores y repositorios;
- probar endpoints enviando solicitudes HTTP;
- verificar respuestas, validaciones y cambios en los datos;
- usar dobles de prueba para no depender de MongoDB durante esta práctica.

## Herramientas

- **Mocha** ejecuta las pruebas y organiza los casos con `describe` e `it`.
- **Chai** permite expresar las comprobaciones con `assert`, `expect` o `should`.
- **Supertest** envía solicitudes HTTP a una aplicación Express y permite revisar el status, el cuerpo y los headers.

Las tres herramientas están en `devDependencies`: se usan durante el desarrollo y no son necesarias para atender solicitudes en producción.

## Preparar el entorno

Abrí una terminal en la carpeta `RecursosBackend-Adoptme` e instalá las dependencias:

```bash
npm install
```

Para ejecutar toda la suite:

```bash
npm test
```

Para ejecutar solo los ejemplos del repositorio de users:

```bash
npm run test-only
```

Mocha encuentra los archivos `*.test.js` dentro de `src/test`. Por eso `npm test` incluye las pruebas unitarias, las pruebas de integración y los ejemplos anteriores.

## Pruebas unitarias

Una prueba unitaria se concentra en una unidad pequeña. Por ejemplo, una prueba de `PetDTO` puede comprobar que el DTO agrega `adopted: false` sin iniciar Express ni acceder a una base de datos.

En las pruebas de controladores, se inyecta un servicio falso. Esto permite preparar respuestas conocidas y verificar qué argumentos recibe el servicio. En las pruebas del repositorio, se usa un DAO falso que devuelve datos en memoria.

Archivos principales:

- `src/test/controllers.unit.test.js`: controladores de users y pets.
- `src/test/dto.unit.test.js`: transformación de datos de entrada y salida.
- `src/test/users.service.unit.test.js`: `UserRepository` con un DAO falso.
- `src/test/asyncHandler.test.js`: envío de errores asincrónicos a Express.
- `src/test/pets.mock.test.js`: repositorio de mascotas con DAO de prueba.

Ejemplo con Chai:

```js
expect(user).to.include({ email: 'ada@example.com' });
```

La comprobación se hace sobre el resultado de la unidad probada; no hace falta levantar el servidor.

## Pruebas de integración y funcionales

Una prueba de integración verifica que varias piezas colaboren. En `src/test/routes.integration.test.js`, Supertest llama a endpoints reales de la app Express: la solicitud atraviesa router, controlador y servicio, y luego se comprueba la respuesta.

La suite cubre:

- listado y búsqueda de users y pets;
- creación y validación de mascotas, también con archivo multipart;
- actualización y eliminación;
- respuestas 404 para recursos inexistentes;
- el middleware global de errores.

Los servicios usados por estas pruebas guardan datos en memoria. Así podemos verificar el efecto de actualizar o borrar sin conectar MongoDB. Como se prueban comportamientos visibles desde HTTP, también se las puede describir como pruebas funcionales de endpoints.

Ejemplo del estilo de una prueba HTTP:

```js
const response = await request(app)
  .post('/api/pets')
  .send({ name: 'Toto', specie: 'cat', birthDate: '2022-01-10' })
  .expect(200);

expect(response.body.status).to.equal('success');
```

## Cómo se prepara la app para las pruebas

`src/app.js` exporta `createApp()`, que configura Express y acepta servicios opcionales. En producción usa los servicios del proyecto; en las pruebas se le pasan implementaciones en memoria.

`src/server.js` importa esa app e inicia el servidor. Separar la configuración del inicio permite que Supertest use la aplicación sin abrir un puerto. Para iniciar el backend normalmente:

```bash
npm start
```

## Actividad sugerida

1. Elegí un endpoint y describí qué debería ocurrir con datos válidos y con datos incompletos.
2. Escribí primero una prueba que verifique la respuesta HTTP y otra que compruebe el efecto en los datos.
3. Agregá un caso para un recurso inexistente.
4. Ejecutá `npm test` y corregí el código si una prueba revela un comportamiento incorrecto.
5. Sumá un caso propio para otro endpoint o una regla de negocio.

Una buena suite no se limita a verificar el status: también comprueba el contenido de la respuesta, que el servicio haya recibido los datos correctos y que los errores no produzcan cambios inesperados.

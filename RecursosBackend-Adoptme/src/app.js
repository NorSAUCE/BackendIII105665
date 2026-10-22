import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import SwaggerUI from 'swagger-ui-express';
import swaggerJSON from './docs/swagger.json' with { type:'json' };
import {logger, loggerTest} from './utils/logger.js';

import usersRouter from './routes/users.router.js';
import petsRouter from './routes/pets.router.js';
import adoptionsRouter from './routes/adoption.router.js';
import sessionsRouter from './routes/sessions.router.js';
import errorHandler from './middlewares/errorHandler.js';


const app = express();
const PORT = process.env.PORT || 8080;
// const pathToSwaggerUi = SwaggerUI.SwaggerUIBundle({
//     spec: swaggerJSON
// })

app.use(express.json());
app.use(cookieParser());

app.use('/api/users',usersRouter);
app.use('/api/pets',petsRouter);
app.use('/api/adoptions',adoptionsRouter);
app.use('/api/sessions',sessionsRouter);

app.use('/loggerTest', loggerTest);

// app.use('/api/docs/v2', express.static(pathToSwaggerUi))
app.use('/api/docs', SwaggerUI.serve);
app.get('/api/docs', SwaggerUI.setup(swaggerJSON));

app.use(errorHandler)

app.listen(PORT,()=>{
    console.log(`Servidor escuchando en puerto: ${PORT}`)
    logger.info(`Servidor escuchando en puerto: ${PORT}`)
    //DEBUG-INFO-WARN-ERROR
})

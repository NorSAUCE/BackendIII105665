import express from 'express';
import cookieParser from 'cookie-parser';
import SwaggerUI from 'swagger-ui-express';
import swaggerJSON from './docs/swagger.json' with { type:'json' };
import {loggerTest} from './utils/logger.js';

import { createUsersRouter } from './routes/users.router.js';
import { createPetsRouter } from './routes/pets.router.js';
import { usersService, petsService } from './services/index.js';
import adoptionsRouter from './routes/adoption.router.js';
import sessionsRouter from './routes/sessions.router.js';
import errorHandler from './middlewares/errorHandler.js';


const createApp = ({ users = usersService, pets = petsService } = {}) => {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());

    app.use('/api/users', createUsersRouter(users));
    app.use('/api/pets', createPetsRouter(pets));
    app.use('/api/adoptions',adoptionsRouter);
    app.use('/api/sessions',sessionsRouter);

    app.use('/loggerTest', loggerTest);
    app.use('/api/docs', SwaggerUI.serve);
    app.get('/api/docs', SwaggerUI.setup(swaggerJSON));
    app.use(errorHandler);

    return app;
};

export { createApp };
export default createApp();

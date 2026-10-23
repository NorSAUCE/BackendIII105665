import { createApp } from './app.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT || 8080;
const app = createApp();

app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto: ${PORT}`);
    logger.info(`Servidor escuchando en puerto: ${PORT}`);
});

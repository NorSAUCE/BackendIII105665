import { Router } from 'express';
import { createUsersController } from '../controllers/users.controller.js';

const createUsersRouter = (service) => {
const router = Router();
const usersController = createUsersController(service);

router.get('/',usersController.getAllUsers);

router.get('/:uid',usersController.getUser);
router.put('/:uid',usersController.updateUser);
router.delete('/:uid',usersController.deleteUser);

return router;
};

export { createUsersRouter };

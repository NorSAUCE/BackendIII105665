import { Router } from 'express';
import { createPetsController } from '../controllers/pets.controller.js';
import uploader from '../utils/uploader.js';
import CustomError from '../utils/CustomError.js';

const createPetsRouter = (service) => {
const router = Router();
const petsController = createPetsController(service);

router.get('/',petsController.getAllPets);
router.post('/',petsController.createPet);
router.post('/withimage',uploader.single('image'), petsController.createPetWithImage);
router.put('/:pid',petsController.updatePet);
router.delete('/:pid',petsController.deletePet);

router.get('/test-error',(req,res,next)=>{
    const error = new CustomError(
        'Mascota no encontrada',404
    )
    next(error)
})

return router;
};

export { createPetsRouter };

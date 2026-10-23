import PetDTO from "../dto/Pet.dto.js";
import { petsService } from "../services/index.js"
import __dirname from "../utils/index.js";
import asyncHandler from "../utils/asyncHandler.js";
import { unlink } from "node:fs/promises";

const createPetsController = (service = petsService) => {
const getAllPets = asyncHandler(async (req, res) => {
    const pets = await service.getAll();
    res.json(pets);
});

const createPet = asyncHandler(async (req, res) => {
    const {name,specie,birthDate} = req.body;
    if(!name||!specie||!birthDate) return res.status(400).send({status:"error",error:"Incomplete values"});
    const pet = PetDTO.getPetInputFrom({name,specie,birthDate});
    const result = await service.create(pet);
    res.send({status:"success",payload:result})
});

const updatePet = asyncHandler(async (req, res) => {
    const petUpdateBody = req.body;
    const petId = req.params.pid;
    const existingPet = await service.getBy({ _id: petId });
    if (!existingPet) return res.status(404).send({ status: "error", error: "Pet not found" });
    await service.update(petId,petUpdateBody);
    res.send({status:"success",message:"pet updated"})
});

const deletePet = asyncHandler(async (req, res) => {
    const petId = req.params.pid;
    const existingPet = await service.getBy({ _id: petId });
    if (!existingPet) return res.status(404).send({ status: "error", error: "Pet not found" });
    await service.delete(petId);
    res.send({status:"success",message:"pet deleted"});
});

const createPetWithImage = asyncHandler(async (req, res) => {
    const file = req.file;
    const {name,specie,birthDate} = req.body;
    if(!name||!specie||!birthDate) {
        if (file) await unlink(file.path).catch(() => {});
        return res.status(400).send({status:"error",error:"Incomplete values"});
    }
    if (!file) return res.status(400).send({ status: "error", error: "Image is required" });
    const pet = PetDTO.getPetInputFrom({
        name,
        specie,
        birthDate,
        image:`${__dirname}/../public/img/${file.filename}`
    });
    const result = await service.create(pet);
    res.send({status:"success",payload:result})
});

return {
    getAllPets,
    createPet,
    updatePet,
    deletePet,
    createPetWithImage
};
};

const { getAllPets, createPet, updatePet, deletePet, createPetWithImage } = createPetsController();

export default {
    getAllPets,
    createPet,
    updatePet,
    deletePet,
    createPetWithImage
};
export { createPetsController };

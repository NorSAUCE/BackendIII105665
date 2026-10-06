import { expect } from 'chai';
import { generatePet, generatePets } from './mocks/pets.mock.js';
import PetRepository from '../repository/PetRepository.js';
import PetsDaoMock from './mocks/pets.dao.mock.js';

describe('Mock de mascotas', () => {

    it('debe generar una mascota con datos válidos', () => {

        const pet = generatePet(); 

        console.log(pet);

        expect(pet).to.have.property('name');
        expect(pet).to.have.property('specie');
        expect(pet).to.have.property('birthDate');
        expect(pet).to.have.property('adopted');
        expect(pet).to.have.property('image');

    });
        it('debe generar la cantidad de mascotas solicitada', () => {

        const pets = generatePets(10);

        expect(pets).to.be.an('array');
        expect(pets).to.have.lengthOf(10);

    });

});

describe('PetRepository con Mock DAO', () => {

    it('debe obtener mascotas sin utilizar MongoDB', async () => {

        const mockDao = new PetsDaoMock();

        const repository = new PetRepository(mockDao);

        const pets = await repository.getAll();

        console.log(pets);

        expect(pets).to.be.an('array');
        expect(pets).to.have.lengthOf(10);

    });

    it('debe obtener una mascota por criterio sin utilizar MongoDB', async () => {

    const mockDao = new PetsDaoMock();

    const repository = new PetRepository(mockDao);

    const pet = await repository.getBy({ name: 'Firulais' });

    console.log(pet);

    expect(pet).to.be.an('object');
    expect(pet).to.have.property('name');
    expect(pet).to.have.property('specie');

});
it('debe devolver null cuando la mascota no existe', async () => {

    const mockDao = new PetsDaoMock();

    const repository = new PetRepository(mockDao);

    const pet = await repository.getBy({ name: 'NoExiste' });

    expect(pet).to.be.null;

});
});


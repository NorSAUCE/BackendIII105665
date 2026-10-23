import { expect } from 'chai';
import { createUsersController } from '../controllers/users.controller.js';
import { createPetsController } from '../controllers/pets.controller.js';

const responseMock = () => ({
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    send(body) { this.body = body; return this; },
    json(body) { this.body = body; return this; }
});

const user = { _id: 'u-1', first_name: 'Ada', last_name: 'Lovelace' };
const pet = { _id: 'p-1', name: 'Mora', specie: 'dog', birthDate: '2020-05-01' };

describe('Pruebas unitarias de usersController', () => {
    it('devuelve la lista de usuarios del servicio', async () => {
        const service = { getAll: async () => [user] };
        const res = responseMock();

        await createUsersController(service).getAllUsers({}, res, () => {});

        expect(res.body).to.deep.equal({ status: 'success', payload: [user] });
    });

    it('envía el usuario encontrado al cliente', async () => {
        const service = { getUserById: async (id) => id === 'u-1' ? user : null };
        const res = responseMock();

        await createUsersController(service).getUser({ params: { uid: 'u-1' } }, res, () => {});

        expect(res.body).to.deep.equal({ status: 'success', payload: user });
    });

    it('devuelve 404 para un usuario inexistente', async () => {
        const service = { getUserById: async () => null };
        const res = responseMock();

        await createUsersController(service).getUser({ params: { uid: 'missing' } }, res, () => {});

        expect(res.statusCode).to.equal(404);
        expect(res.body.error).to.equal('User not found');
    });

    it('actualiza el usuario existente con el cuerpo recibido', async () => {
        let updateArgs;
        const service = {
            getUserById: async () => user,
            update: async (...args) => { updateArgs = args; }
        };
        const res = responseMock();
        const changes = { first_name: 'Augusta' };

        await createUsersController(service).updateUser({ params: { uid: 'u-1' }, body: changes }, res, () => {});

        expect(updateArgs).to.deep.equal(['u-1', changes]);
        expect(res.body.message).to.equal('User updated');
    });

    it('no intenta actualizar un usuario inexistente', async () => {
        let updateCalled = false;
        const service = { getUserById: async () => null, update: async () => { updateCalled = true; } };
        const res = responseMock();

        await createUsersController(service).updateUser({ params: { uid: 'missing' }, body: {} }, res, () => {});

        expect(res.statusCode).to.equal(404);
        expect(updateCalled).to.equal(false);
    });

    it('elimina el usuario existente', async () => {
        let deletedId;
        const service = { getUserById: async () => user, delete: async (id) => { deletedId = id; } };
        const res = responseMock();

        await createUsersController(service).deleteUser({ params: { uid: 'u-1' } }, res, () => {});

        expect(deletedId).to.equal('u-1');
        expect(res.body.message).to.equal('User deleted');
    });
});

describe('Pruebas unitarias de petsController', () => {
    it('devuelve la lista de mascotas del servicio', async () => {
        const service = { getAll: async () => [pet] };
        const res = responseMock();

        await createPetsController(service).getAllPets({}, res, () => {});

        expect(res.body).to.deep.equal([pet]);
    });

    it('rechaza una mascota incompleta sin llamar al servicio', async () => {
        let createCalled = false;
        const service = { create: async () => { createCalled = true; } };
        const res = responseMock();

        await createPetsController(service).createPet({ body: { name: 'Toto' } }, res, () => {});

        expect(res.statusCode).to.equal(400);
        expect(res.body.error).to.equal('Incomplete values');
        expect(createCalled).to.equal(false);
    });

    it('convierte y crea una mascota válida', async () => {
        let createdPet;
        const service = { create: async (data) => { createdPet = data; return { _id: 'p-2', ...data }; } };
        const res = responseMock();

        await createPetsController(service).createPet({ body: { name: 'Toto', specie: 'cat', birthDate: '2022-01-10' } }, res, () => {});

        expect(createdPet).to.include({ name: 'Toto', specie: 'cat', birthDate: '2022-01-10', adopted: false });
        expect(res.body.payload._id).to.equal('p-2');
    });

    it('responde 404 y no actualiza una mascota inexistente', async () => {
        let updateCalled = false;
        const service = { getBy: async () => null, update: async () => { updateCalled = true; } };
        const res = responseMock();

        await createPetsController(service).updatePet({ params: { pid: 'missing' }, body: { name: 'Nuevo' } }, res, () => {});

        expect(res.statusCode).to.equal(404);
        expect(res.body.error).to.equal('Pet not found');
        expect(updateCalled).to.equal(false);
    });

    it('actualiza una mascota existente', async () => {
        let updateArgs;
        const service = { getBy: async () => pet, update: async (...args) => { updateArgs = args; } };
        const res = responseMock();
        const changes = { name: 'Mora II' };

        await createPetsController(service).updatePet({ params: { pid: 'p-1' }, body: changes }, res, () => {});

        expect(updateArgs).to.deep.equal(['p-1', changes]);
        expect(res.body.message).to.equal('pet updated');
    });

    it('elimina una mascota existente', async () => {
        let deletedId;
        const service = { getBy: async () => pet, delete: async (id) => { deletedId = id; } };
        const res = responseMock();

        await createPetsController(service).deletePet({ params: { pid: 'p-1' } }, res, () => {});

        expect(deletedId).to.equal('p-1');
        expect(res.body.message).to.equal('pet deleted');
    });

    it('exige archivo para crear una mascota con imagen', async () => {
        const service = { create: async () => { throw new Error('No debe crear la mascota'); } };
        const res = responseMock();

        await createPetsController(service).createPetWithImage({ body: { name: 'Luna', specie: 'cat', birthDate: '2021-07-09' } }, res, () => {});

        expect(res.statusCode).to.equal(400);
        expect(res.body.error).to.equal('Image is required');
    });

    it('envía los errores del servicio a next', async () => {
        const expectedError = new Error('falló el servicio');
        let receivedError;
        const service = { getAll: async () => { throw expectedError; } };

        await createPetsController(service).getAllPets({}, responseMock(), (error) => { receivedError = error; });

        expect(receivedError).to.equal(expectedError);
    });
});

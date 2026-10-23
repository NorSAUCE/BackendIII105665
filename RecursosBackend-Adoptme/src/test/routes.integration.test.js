import { expect } from 'chai';
import request from 'supertest';
import { unlink } from 'node:fs/promises';
import { createApp } from '../app.js';

const clone = (value) => structuredClone(value);

class InMemoryService {
    constructor(records) {
        this.records = new Map(records.map((record) => [record._id, clone(record)]));
        this.nextId = records.length + 1;
    }

    async getAll() { return [...this.records.values()].map(clone); }
    async getBy(criteria) { return clone(this.records.get(criteria._id) ?? null); }
    async getUserById(id) { return this.getBy({ _id: id }); }
    async create(record) {
        const saved = { _id: String(this.nextId++), ...clone(record) };
        this.records.set(saved._id, saved);
        return clone(saved);
    }
    async update(id, changes) {
        const record = this.records.get(id);
        if (!record) return null;
        Object.assign(record, clone(changes));
        return clone(record);
    }
    async delete(id) {
        const record = this.records.get(id) ?? null;
        this.records.delete(id);
        return clone(record);
    }
}

const userFixture = { _id: 'user-1', first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com', role: 'user' };
const petFixture = { _id: 'pet-1', name: 'Mora', specie: 'dog', birthDate: '2020-05-01', adopted: false };

const createTestApp = () => {
    const users = new InMemoryService([userFixture]);
    const pets = new InMemoryService([petFixture]);
    return { app: createApp({ users, pets }), users, pets };
};

describe('Router de users', () => {
    it('lista los usuarios con el formato esperado', async () => {
        const { app } = createTestApp();
        const response = await request(app).get('/api/users').expect(200);
        expect(response.body).to.deep.equal({ status: 'success', payload: [userFixture] });
    });

    it('obtiene un usuario por ID', async () => {
        const { app } = createTestApp();
        const response = await request(app).get('/api/users/user-1').expect(200);
        expect(response.body).to.deep.equal({ status: 'success', payload: userFixture });
    });

    it('responde 404 si el usuario no existe', async () => {
        const { app } = createTestApp();
        const response = await request(app).get('/api/users/inexistente').expect(404);
        expect(response.body).to.deep.equal({ status: 'error', error: 'User not found' });
    });

    it('actualiza un usuario y conserva los otros campos', async () => {
        const { app, users } = createTestApp();
        const response = await request(app).put('/api/users/user-1').send({ first_name: 'Augusta' }).expect(200);
        expect(response.body).to.deep.equal({ status: 'success', message: 'User updated' });
        expect(await users.getUserById('user-1')).to.include({ first_name: 'Augusta', last_name: 'Lovelace' });
    });

    it('no actualiza un usuario inexistente', async () => {
        const { app } = createTestApp();
        const response = await request(app).put('/api/users/inexistente').send({ first_name: 'Grace' }).expect(404);
        expect(response.body.error).to.equal('User not found');
    });

    it('elimina el usuario y luego responde 404 al consultarlo', async () => {
        const { app } = createTestApp();
        const response = await request(app).delete('/api/users/user-1').expect(200);
        expect(response.body).to.deep.equal({ status: 'success', message: 'User deleted' });
        await request(app).get('/api/users/user-1').expect(404);
    });

    it('responde 404 al eliminar un usuario inexistente', async () => {
        const { app } = createTestApp();
        const response = await request(app).delete('/api/users/inexistente').expect(404);
        expect(response.body.error).to.equal('User not found');
    });
});

describe('Router de pets', () => {
    it('lista las mascotas', async () => {
        const { app } = createTestApp();
        const response = await request(app).get('/api/pets').expect(200);
        expect(response.body).to.deep.equal([petFixture]);
    });

    it('crea una mascota y aplica los valores predeterminados del DTO', async () => {
        const { app } = createTestApp();
        const response = await request(app).post('/api/pets').send({ name: 'Toto', specie: 'cat', birthDate: '2022-01-10' }).expect(200);
        expect(response.body.status).to.equal('success');
        expect(response.body.payload).to.include({ name: 'Toto', specie: 'cat', adopted: false, image: '' });
        expect(response.body.payload).to.have.property('_id');
    });

    it('rechaza crear una mascota si faltan datos obligatorios', async () => {
        const { app, pets } = createTestApp();
        const response = await request(app).post('/api/pets').send({ name: 'Toto', specie: 'cat' }).expect(400);
        expect(response.body).to.deep.equal({ status: 'error', error: 'Incomplete values' });
        expect(await pets.getAll()).to.have.lengthOf(1);
    });

    it('crea una mascota con imagen multipart', async () => {
        const { app } = createTestApp();
        let uploadedPath;
        try {
            const response = await request(app).post('/api/pets/withimage')
                .field('name', 'Luna').field('specie', 'cat').field('birthDate', '2021-07-09')
                .attach('image', Buffer.from('imagen de prueba'), 'luna.txt').expect(200);
            expect(response.body.payload).to.include({ name: 'Luna', specie: 'cat', adopted: false });
            expect(response.body.payload.image).to.match(/luna\.txt$/);
            uploadedPath = response.body.payload.image;
        } finally {
            if (uploadedPath) await unlink(uploadedPath).catch(() => {});
        }
    });

    it('rechaza una mascota con imagen si faltan datos obligatorios', async () => {
        const { app } = createTestApp();
        const response = await request(app).post('/api/pets/withimage').field('name', 'Luna')
            .attach('image', Buffer.from('imagen de prueba'), 'luna.txt').expect(400);
        expect(response.body.error).to.equal('Incomplete values');
    });

    it('rechaza crear una mascota con imagen si no se adjunta archivo', async () => {
        const { app } = createTestApp();
        const response = await request(app).post('/api/pets/withimage').field('name', 'Luna')
            .field('specie', 'cat').field('birthDate', '2021-07-09').expect(400);
        expect(response.body.error).to.equal('Image is required');
    });

    it('actualiza una mascota existente', async () => {
        const { app, pets } = createTestApp();
        const response = await request(app).put('/api/pets/pet-1').send({ name: 'Mora II' }).expect(200);
        expect(response.body).to.deep.equal({ status: 'success', message: 'pet updated' });
        expect(await pets.getBy({ _id: 'pet-1' })).to.include({ name: 'Mora II', specie: 'dog' });
    });

    it('responde 404 al actualizar una mascota inexistente', async () => {
        const { app } = createTestApp();
        const response = await request(app).put('/api/pets/inexistente').send({ name: 'Nueva' }).expect(404);
        expect(response.body.error).to.equal('Pet not found');
    });

    it('elimina una mascota y luego deja de incluirla en el listado', async () => {
        const { app } = createTestApp();
        const response = await request(app).delete('/api/pets/pet-1').expect(200);
        expect(response.body).to.deep.equal({ status: 'success', message: 'pet deleted' });
        expect((await request(app).get('/api/pets').expect(200)).body).to.deep.equal([]);
    });

    it('responde 404 al eliminar una mascota inexistente', async () => {
        const { app } = createTestApp();
        const response = await request(app).delete('/api/pets/inexistente').expect(404);
        expect(response.body.error).to.equal('Pet not found');
    });

    it('devuelve el error de aplicación con el formato del middleware global', async () => {
        const { app } = createTestApp();
        const response = await request(app).get('/api/pets/test-error').expect(404);
        expect(response.body).to.deep.equal({ status: 'error', message: 'Mascota no encontrada' });
    });
});

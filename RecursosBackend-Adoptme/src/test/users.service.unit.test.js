import chai from 'chai';
import UserRepository from '../repository/UserRepository.js';

const { assert, expect } = chai;
chai.should();

const userFixture = {
    _id: 'user-1',
    first_name: 'Ada',
    last_name: 'Lovelace',
    email: 'ada@example.com',
    role: 'user'
};

const createDaoMock = () => ({
    get: async () => [userFixture],
    getBy: async (criteria) => criteria.email === userFixture.email || criteria._id === userFixture._id ? userFixture : null,
    save: async (user) => ({ _id: 'user-2', ...user }),
    update: async (id, changes) => ({ ...userFixture, _id: id, ...changes }),
    delete: async (id) => ({ ...userFixture, _id: id })
});

describe('Pruebas unitarias de UserRepository', () => {
    it('obtiene todos los usuarios usando el DAO', async () => {
        const repository = new UserRepository(createDaoMock());

        const users = await repository.getAll();

        assert.isArray(users);
        assert.lengthOf(users, 1);
    });

    it('busca un usuario por email', async () => {
        const repository = new UserRepository(createDaoMock());

        const user = await repository.getUserByEmail('ada@example.com');

        expect(user).to.include({ first_name: 'Ada', email: 'ada@example.com' });
    });

    it('busca un usuario por ID y devuelve null si no existe', async () => {
        const repository = new UserRepository(createDaoMock());

        const found = await repository.getUserById('user-1');
        const missing = await repository.getUserById('missing');

        found.should.have.property('_id', 'user-1');
        assert.isNull(missing);
    });

    it('crea usuarios delegando el guardado al DAO', async () => {
        const repository = new UserRepository(createDaoMock());
        const newUser = { first_name: 'Grace', last_name: 'Hopper', email: 'grace@example.com' };

        const saved = await repository.create(newUser);

        expect(saved).to.include({ _id: 'user-2', first_name: 'Grace', email: 'grace@example.com' });
    });
});

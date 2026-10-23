import { after, before, beforeEach, describe, it } from 'mocha';
import { expect } from 'chai';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { usersService } from '../services/index.js';

const testDatabaseName = 'adoptme_test';

describe('Ejemplo opcional: UserRepository con MongoDB', function () {
    before(async function () {
        this.timeout(15000);
        const uri = process.env.MONGODB_TEST_URI;
        if (!uri) throw new Error('Configurá MONGODB_TEST_URI con la URI de una instancia MongoDB de prueba.');
        await mongoose.connect(uri, { dbName: testDatabaseName });
    });

    beforeEach(async () => {
        await User.deleteMany({});
    });

    after(async () => {
        await mongoose.disconnect();
    });

    it('guarda un usuario y permite buscarlo por email', async () => {
        await usersService.create({
            first_name: 'Ada',
            last_name: 'Lovelace',
            email: 'ada@example.com',
            password: 'clave-de-prueba'
        });

        const user = await usersService.getUserByEmail('ada@example.com');

        expect(user).to.exist;
        expect(user.email).to.equal('ada@example.com');
        expect(user.first_name).to.equal('Ada');
    });
});

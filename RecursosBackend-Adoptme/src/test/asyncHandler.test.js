import { expect } from 'chai';
import asyncHandler from '../utils/asyncHandler.js';

describe('asyncHandler', () => {

    it('debe enviar el error al next', async () => {

        const error = new Error('Error de prueba');

        const next = (receivedError) => {

            expect(receivedError).to.equal(error);

        };

        const handler = asyncHandler(async () => {

            throw error;

        });

        await handler({}, {}, next);

    });

});
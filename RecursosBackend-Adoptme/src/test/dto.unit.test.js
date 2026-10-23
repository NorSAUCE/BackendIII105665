import { expect } from 'chai';
import PetDTO from '../dto/Pet.dto.js';
import UserDTO from '../dto/User.dto.js';

describe('Pruebas unitarias de DTOs', () => {
    it('mapea los datos de mascota y define adopted como false', () => {
        const result = PetDTO.getPetInputFrom({ name: 'Mora', specie: 'dog', birthDate: '2020-05-01', image: '/img/mora.jpg' });

        expect(result).to.deep.equal({ name: 'Mora', specie: 'dog', birthDate: '2020-05-01', image: '/img/mora.jpg', adopted: false });
    });

    it('usa valores predeterminados si los campos de mascota no están informados', () => {
        const result = PetDTO.getPetInputFrom({});

        expect(result).to.deep.equal({ name: '', specie: '', birthDate: '12-30-2000', image: '', adopted: false });
    });

    it('construye el token de usuario con nombre completo, rol y email', () => {
        const result = UserDTO.getUserTokenFrom({ first_name: 'Ada', last_name: 'Lovelace', role: 'admin', email: 'ada@example.com' });

        expect(result).to.deep.equal({ name: 'Ada Lovelace', role: 'admin', email: 'ada@example.com' });
    });
});

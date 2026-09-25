import { faker } from '@faker-js/faker';

export const generatePet = () => {
    return {
        name: faker.person.firstName(),
        specie: faker.helpers.arrayElement(['dog', 'cat', 'rabbit']),
        birthDate: faker.date.past(),
        adopted: faker.datatype.boolean(),
        image: faker.image.url()
    };
};
export const generatePets = (quantity) => {
    return Array.from(
        { length: quantity },
        () => generatePet()
    );
};
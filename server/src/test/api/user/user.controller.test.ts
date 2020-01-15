import {AreaApplication} from '../../../application';
import {setupApplication} from '../../acceptance/test-helper';
import { UserRepository } from '../../../repositories/user.repository';
import { Client, expect } from '@loopback/testlab';

describe('/users', () => {
    let app: AreaApplication;
    let client: Client;

    let userRepo: UserRepository;

    const userData = {
        email: "test@test.fr",
        password: 'test'
    };

    before('setupApplication', async() => {
        ({app, client} = await setupApplication());
        userRepo = await app.get('repositories.UserRepository');
    });
    before(migrateSchema);
    beforeEach(async () => {
        await userRepo.deleteAll();
        await userRepo.create(userData);
    });

    after(async () => {
        await app.stop();
    });

    describe('POST /users/register', () => {
        it('Error when email already taken', async () => {
            const res = await client
                .post('/users/register?redirectURL=http://localhost:8081/validate?api=http://localhost:8080')
                .send({email: "test@test.fr", password: "p@22w0rd"})
                .expect(409);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Email already in use')
        });

        it('Error when email is invalid', async () => {
            const res = await client
                .post('/users/register?redirectURL=http://localhost:8081/validate?api=http://localhost:8080')
                .send({email: "testest.fr", password: "p@22w0rd"})
                .expect(400);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Invalid email.')
        });

        it('Empty email', async () => {
            const res = await client
                .post('/users/register?redirectURL=http://localhost:8081/validate?api=http://localhost:8080')
                .send({password: "p@22w0rd"})
                .expect(422);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('The request body is invalid. See error object `details` property for more info.')
        });

        it('Empty password', async () => {
            const res = await client
                .post('/users/register?redirectURL=http://localhost:8081/validate?api=http://localhost:8080')
                .send({email: "test@test.fr"})
                .expect(422);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('The request body is invalid. See error object `details` property for more info.')
        });

        it('Success', async () => {
            const newUser = {email: "test@area.fr", password: "p@22w0rd"};
            const res = await client
                .post('/users/register?redirectURL=http://localhost:8081/validate?api=http://localhost:8080')
                .send(newUser)
                .expect(200);
            const body = res.body;
            expect(body.id).to.not.empty();
        });
    });

    async function migrateSchema() {
        await app.migrateSchema();
    }
});
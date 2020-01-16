import {AreaApplication} from '../../../application';
import {setupApplication} from '../../acceptance/test-helper';
import { UserRepository } from '../../../repositories/user.repository';
import { Client, expect } from '@loopback/testlab';
import {User} from "../../../models";

describe('/users', () => {
    let app: AreaApplication;
    let client: Client;

    let userRepo: UserRepository;

    let userId: string | undefined;
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
        userId = (await userRepo.create(userData)).id;
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
            const dbUser: User = await userRepo.findById(body.id);
            expect(dbUser.validationToken).to.not.empty();
            expect(dbUser.role).containDeep(['email_not_validated']);
            expect(dbUser.role).not.containDeep(['user']);
        });

        it('Should fail when redirect url is not given', async () => {
            const newUser = {email: "test@area.fr", password: "p@22w0rd"};
            const res = await client
                .post('/users/register')
                .send(newUser)
                .expect(400);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Missing redirect URL.')
        });
    });

    describe('PATCH /users/validate', () => {
        it('Should validate token', async () => {
            const token = 'azertyuiopqsdfghjklmwxcv';
            await userRepo.create({
                email: "test2@test.fr",
                password: 'test2',
                validationToken: token,
                role: ['email_not_validated']
            });
            const res = await client
                .patch('/users/validate?token=' + token)
                .send({})
                .expect(200);
            const body = res.body;
            expect(body.id).to.not.empty();
            const dbUser: User = await userRepo.findById(body.id);
            expect(dbUser.validationToken).to.be.null();
            expect(dbUser.role).containDeep(['user']);
            expect(dbUser.role).not.containDeep(['email_not_validated']);
        });

        it('Should send 400 on empty token', async () => {
            const token = 'azertyuiopqsdfghjklmwxcv';
            await userRepo.create({
                email: "test2@test.fr",
                password: 'test2',
                validationToken: token,
                role: ['email_not_validated']
            });
            const res = await client
                .patch('/users/validate?token=')
                .send({})
                .expect(400);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Missing token');
        });
        it('Should send 400 on missing token', async () => {
            const token = 'azertyuiopqsdfghjklmwxcv';
            await userRepo.create({
                email: "test2@test.fr",
                password: 'test2',
                validationToken: token,
                role: ['email_not_validated']
            });
            const res = await client
                .patch('/users/validate')
                .send({})
                .expect(400);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Missing token');
        });

        it('Should send 404 on invalid token', async () => {
            const token = 'azertyuiopqsdfghjklmwxcv';
            await userRepo.create({
                email: "test2@test.fr",
                password: 'test2',
                validationToken: token,
                role: ['email_not_validated']
            });
            const res = await client
                .patch('/users/validate?token=toto')
                .send({})
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Token not found');
        });
    });

    describe('GET /users/{id}', () => {
        it("Should send 404 User not found.", async () => {
            const res = await client
                .get('/users/invalidId')
                .send()
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Entity not found: User with id "invalidId"');
        });

        it("Success", async () => {
            const res = await client
                .get('/users/' + userId)
                .send()
                .expect(200);
            const body = res.body;
            expect(body.id).to.equal(JSON.parse(JSON.stringify(userId)));
            expect(body.email).to.equal(userData.email);
        });
    });

    async function migrateSchema() {
        await app.migrateSchema();
    }
});
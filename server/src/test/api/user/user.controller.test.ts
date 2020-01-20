import {AreaApplication} from '../../../application';
import {setupApplication} from '../../acceptance/test-helper';
import { UserRepository } from '../../../repositories/user.repository';
import { Client, expect } from '@loopback/testlab';
import {User} from "../../../models";
import {TokenServiceBindings} from "../../../keys";

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
        await client
            .post('/users/register?redirectURL=http://localhost:8081/validate?api=http://localhost:8080')
            .send(userData)
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

    describe('POST /users/login', () => {
        it('Success', async () => {
            const res = await client
                .post('/users/login')
                .send(userData)
                .expect(200);
            const body = res.body;
            expect(body.token).to.not.empty();
        });

        it('fails when email invalid', async () => {
            await client
                .post('/users/login')
                .send({
                    email: "test@testa.fr",
                    password: 'test'
                })
                .expect(401);
        });

        it('fails when password invalid', async () => {
            await client
                .post('/users/login')
                .send({
                    email: "test@test.fr",
                    password: 'testeuh'
                })
                .expect(401);
        });

        it('fails when password and email are invalid', async () => {
            await client
                .post('/users/login')
                .send({
                    email: "test@testa.fr",
                    password: 'testeuh'
                })
                .expect(401);
        });

        it('fails when password and email are empty', async () => {
            await client
                .post('/users/login')
                .send({
                    email: "",
                    password: ''
                })
                .expect(422);
        });

        it('fails when email is empty', async () => {
            await client
                .post('/users/login')
                .send({
                    email: "",
                    password: 'testeuh'
                })
                .expect(422);
        });

        it('fails when password is empty', async () => {
            await client
                .post('/users/login')
                .send({
                    email: "test@test.fr",
                    password: ''
                })
                .expect(422);
        });
    });

    describe('POST /users/resetPassword', () => {
        it('Should create a reset password token on existing user', async () => {
            const user = await userRepo.create({
                email: "test2@test.fr",
                password: 'test2',
                validationToken: undefined,
                role: ['user']
            });
            const postData = {
                email: 'test2@test.fr',
                redirectURL: 'http://localhost:8081/reset?api=http://localhost:8080'
            };
            await client
                .post('/users/resetPassword')
                .send(postData)
                .expect(200);
            const dbUser: User = await userRepo.findById(user.id);
            expect(dbUser.resetToken).to.not.empty();
            expect(dbUser.resetToken).to.not.null();
        });
        it('Should not create error on non existing user', async () => {
            const postData = {
                email: 'test2@test.fr',
                redirectURL: 'http://localhost:8081/reset?api=http://localhost:8080'
            };
            await client
                .post('/users/resetPassword')
                .send(postData)
                .expect(200);
        });
        it('Should raise error on missing email', async () => {
            const postData = {
                redirectURL: 'http://localhost:8081/reset?api=http://localhost:8080'
            };
            await client
                .post('/users/resetPassword')
                .send(postData)
                .expect(422);
        });
        it('Should raise error on missing redirectURL', async () => {
            const postData = {
                email: 'test2@test.fr'
            };
            await client
                .post('/users/resetPassword')
                .send(postData)
                .expect(422);
        });
        it('Should raise error on invalid email', async () => {
            const postData = {
                email: 'thisIsNotAnEmail',
                redirectURL: 'http://localhost:8081/reset?api=http://localhost:8080'
            };
            await client
                .post('/users/resetPassword')
                .send(postData)
                .expect(400);
        });
    });

    describe('PATCH /users/resetPassword', () => {
        it('Should validate a reset token and change password', async () => {
            const token = 'azertyuiopqsdfghjklmwxcv';
            const user = await userRepo.create({
                email: "test2@test.fr",
                password: 'test2',
                validationToken: undefined,
                role: ['user'],
                resetToken: token
            });
            const patchData = {
                token: token,
                password: 'newPassword'
            };
            await client
                .patch('/users/resetPassword')
                .send(patchData)
                .expect(200);
            const dbUser: User = await userRepo.findById(user.id);
            expect(dbUser.resetToken).to.be.null();
            expect(dbUser.password).to.not.equal(user.password);
        });
        it('Should raise an Not Found error on non existing token', async () => {
            const token = 'azertyuiopqsdfghjklmwxcv';
            const user = await userRepo.create({
                email: "test2@test.fr",
                password: 'test2',
                validationToken: undefined,
                role: ['user'],
                resetToken: undefined
            });
            const patchData = {
                token: token,
                password: 'newPassword'
            };
            await client
                .patch('/users/resetPassword')
                .send(patchData)
                .expect(404);
            const dbUser: User = await userRepo.findById(user.id);
            expect(dbUser.password).to.equal(user.password);
        });
        it('Should raise an Not Found error on invalid token', async () => {
            const token = 'azertyuiopqsdfghjklmwxcv';
            const user = await userRepo.create({
                email: "test2@test.fr",
                password: 'test2',
                validationToken: undefined,
                role: ['user'],
                resetToken: 'vcxwmlkjhgfdsqpoiuytreza'
            });
            const patchData = {
                token: token,
                password: 'newPassword'
            };
            await client
                .patch('/users/resetPassword')
                .send(patchData)
                .expect(404);
            const dbUser: User = await userRepo.findById(user.id);
            expect(dbUser.password).to.equal(user.password);
        });
        it('Should raise an error on missing token', async () => {
            const token = 'azertyuiopqsdfghjklmwxcv';
            await userRepo.create({
                email: "test2@test.fr",
                password: 'test2',
                validationToken: undefined,
                role: ['user'],
                resetToken: token
            });
            const patchData = {
                password: 'newPassword'
            };
            await client
                .patch('/users/resetPassword')
                .send(patchData)
                .expect(422);
        });
        it('Should raise an error on missing password', async () => {
            const token = 'azertyuiopqsdfghjklmwxcv';
            await userRepo.create({
                email: "test2@test.fr",
                password: 'test2',
                validationToken: undefined,
                role: ['user'],
                resetToken: token
            });
            const patchData = {
                token: token
            };
            await client
                .patch('/users/resetPassword')
                .send(patchData)
                .expect(422);
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
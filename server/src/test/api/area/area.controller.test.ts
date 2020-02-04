import {AreaApplication} from '../../../application';
import {setupApplication} from '../../acceptance/test-helper';
import { UserRepository } from '../../../repositories/user.repository';
import { Client } from '@loopback/testlab';
import {AreaRepository} from "../../../repositories";
import {createUser, getJWT} from "../utils";

describe('/areas', () => {
    let app: AreaApplication;
    let client: Client;

    let userRepo: UserRepository;
    let areaRepo: AreaRepository;

    let userId: string | undefined;
    let userToken: string;
    const users = [
        {
            email: "user@mail.fr",
            password: 'test',
            token: ''
        },
        {
            email: "user1@mail.fr",
            password: 'test',
            token: ''
        }
    ];

    before('setupApplication', async() => {
        ({app, client} = await setupApplication());
        userRepo = await app.get('repositories.UserRepository');
        areaRepo = await app.get('repositories.AreaRepository');
    });
    before(async () => {
        await app.migrateSchema();
    });
    beforeEach(async () => {
        const user = await createUser(users[0].email, users[0].password);
        const user2 = await createUser(users[1].email, users[0].password);
        users[0].token = await getJWT(users[0].email, users[0].password);
        users[1].token = await getJWT(users[1].email, users[1].password);
    });

    after(async () => {
        await app.stop();
    });

    describe('POST /areas', () => {
        it('Should create a new area instance', async () => {

        });

        it('Should send a 409 Conflict if an area with the same name exists', async () => {

        });

        it('Should send 401 Unauthorized for a request without token', async () => {

        });

        it('Should send a 400 Bad Request if there is no name', async () => {

        });
    });

    describe('GET /areas', () => {
        it('Should return an array of areas', async () => {

        });

        it('Should return an empty array if there is none', async () => {

        });

        it('Should send 401 Unauthorized for a request without token', async () => {

        });
    });

    describe('GET /areas/count', () => {
        it('Should return the count of areas', async () => {
            //TODO Test 0 and X
        });

        it('Should send 401 Unauthorized for a request without token', async () => {

        });
    });

    describe('GET /areas/{id}', () => {
        it('Should send the requested area', async () => {

        });

        it('Should send 404 Not Found if the id doesn\'t match', async () => {

        });

        it('Should send 404 Not Found if the area belongs to another user', async () => {

        });

        it('Should send 401 Unauthorized for a request without token', async () => {

        });
    });

    describe('DELETE /areas/{id}', () => {
        it('Should delete the specified area', async () => {

        });

        it('Should send 404 Not Found if the id doesn\'t match', async () => {

        });

        it('Should send 404 Not Found if the area belongs to another user', async () => {

        });

        it('Should send 401 Unauthorized for a request without token', async () => {

        });
    });

    describe('PATCH /areas/{id}', () => {
        it('Should update the specified area', async () => {

        });

        it('Should send 404 Not Found if the id doesn\'t match', async () => {

        });

        it('Should send 404 Not Found if the area belongs to another user', async () => {

        });

        it('Should send 401 Unauthorized for a request without token', async () => {

        });
    });

    describe('PATCH /areas/enable/{id}', () => {
        it('Should enable the specified area', async () => {

        });

        it('Should let enabled the specified area if it was already enabled', async () => {

        });

        it('Should send 404 Not Found if the id doesn\'t match', async () => {

        });

        it('Should send 404 Not Found if the area belongs to another user', async () => {

        });

        it('Should send 401 Unauthorized for a request without token', async () => {

        });
    });

    describe('PATCH /areas/disable/{id}', () => {
        it('Should disable the specified area', async () => {

        });

        it('Should let disabled the specified area if it was already disabled', async () => {

        });

        it('Should send 404 Not Found if the id doesn\'t match', async () => {

        });

        it('Should send 404 Not Found if the area belongs to another user', async () => {

        });

        it('Should send 401 Unauthorized for a request without token', async () => {

        });
    });
});
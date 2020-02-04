import {AreaApplication} from '../../../application';
import {setupApplication} from '../../acceptance/test-helper';
import { UserRepository } from '../../../repositories/user.repository';
import { Client, expect } from '@loopback/testlab';
import {User} from "../../../models";
import {AreaRepository} from "../../../repositories";

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

    });

    describe('GET /areas', () => {

    });

    describe('GET /areas/count', () => {

    });

    describe('GET /areas/{id}', () => {

    });

    describe('DELETE /areas/{id}', () => {

    });

    describe('PATCH /areas/{id}', () => {

    });

    describe('PATCH /areas/enable/{id}', () => {

    });

    describe('PATCH /areas/disable/{id}', () => {

    });
});
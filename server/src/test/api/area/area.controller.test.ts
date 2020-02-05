import {TestHelper} from '../../acceptance/test-helper';
import {expect} from '@loopback/testlab';
import {User} from "../../../models";
import {AreaRepository} from "../../../repositories";

describe('/areas', () => {
    const helper: TestHelper = new TestHelper();
    let areaRepo: AreaRepository;

    //let userId: string | undefined;
    //let userToken: string;
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
        await helper.initTestHelper();
        areaRepo = await helper.app.get('repositories.AreaRepository');
    });
    beforeEach(async () => {
        //const user = await helper.createUser(users[0].email, users[0].password, false);
        //const user2 = await helper.createUser(users[1].email, users[0].password, false);
        users[0].token = await helper.getJWT(users[0].email, users[0].password);
        users[1].token = await helper.getJWT(users[1].email, users[1].password);
    });

    after(async () => {
        await helper.stop();
    });

    describe('POST /areas', () => {
        it('Should create a new area instance', async () => {
            const newArea = {
                name: "Test AREA",
                enabled: true
            };
            const res = await helper.client
                .post('/areas')
                .send(newArea)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(200);
            const body = res.body;
            console.log(body);
            const dbUser: User = await helper.userRepository.findById(body.id);
            expect(dbUser.validationToken).to.not.empty();
            expect(dbUser.role).containDeep(['email_not_validated']);
            expect(dbUser.role).not.containDeep(['user']);
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
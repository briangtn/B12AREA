import {TestHelper} from '../../acceptance/test-helper';
import {expect} from '@loopback/testlab';
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
        await helper.createUser(users[0].email, users[0].password, false);
        await helper.createUser(users[1].email, users[0].password, false);
    });
    beforeEach(async () => {
        users[0].token = await helper.getJWT(users[0].email, users[0].password);
        users[1].token = await helper.getJWT(users[1].email, users[1].password);
    });

    after(async () => {
        await helper.stop();
    });

    describe('POST /areas', () => {
        const newArea = {
            name: "Test AREA",
            enabled: false
        };

        it('Should create a new area instance', async () => {
            const res = await helper.client
                .post('/areas')
                .send(newArea)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(200);
            const body = res.body;
            expect(body.id).not.empty();
            const area = await areaRepo.findById(body.id);
            expect(area.name).eql(newArea.name);
            expect(area.enabled).eql(newArea.enabled);
            expect(area.ownerId).eql(users[0].email);
        });

        it('Should send a 409 Conflict if an area with the same name exists', async () => {
            before(async () => {
                await helper.client
                    .post('/areas')
                    .send(newArea)
                    .set('Authorization', 'Bearer ' + users[0].token)
            });
            await helper.client
                .post('/areas')
                .send(newArea)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(409);
        });

        it('Should send 401 Unauthorized for a request without token', async () => {
            const res = await helper.client
                .post('/areas')
                .send(newArea)
                .expect(401);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Authorization header not found.');
        });

        it('Should enabled by default if not specified', async () => {
            const area = {
                name: 'Hello AREA'
            };

            const res = await helper.client
                .post('/areas')
                .send(area)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(200);
            const body = res.body;
            expect(body.id).not.empty();
            const createdArea = await areaRepo.findById(body.id);
            expect(createdArea.name).eql(area.name);
            expect(createdArea.enabled).eql(true);
            expect(createdArea.ownerId).eql(users[0].email);
        });

        it('Should send a 422 if there is no name', async () => {
            const res = await helper.client
                .post('/areas')
                .send({
                    enabled: true
                })
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(422);
            const error = JSON.parse(res.error.text);
            expect(error.error.details[0].message).to.equal('should have required property \'name\'')
        });
    });

    describe('GET /areas', () => {
        it('Should return an array of areas', async () => {

        });

        it('Should return an empty array if there is none', async () => {

        });

        it('Should send 401 Unauthorized for a request without token', async () => {
            const res = await helper.client
                .get('/areas')
                .expect(401);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Authorization header not found.');
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
import {TestHelper} from '../../acceptance/test-helper';
import {expect} from '@loopback/testlab';
import {AreaRepository} from "../../../repositories";

describe('/areas', () => {
    const helper: TestHelper = new TestHelper();
    let areaRepo: AreaRepository;

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
        await areaRepo.deleteAll();
    });

    after(async () => {
        await areaRepo.deleteAll();
        await helper.userRepository.deleteAll();
        await helper.stop();
    });

    const newArea = {
        name: "Test AREA",
        enabled: false
    };

    describe('POST /areas', () => {
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
            await helper.client
                .post('/areas')
                .send(newArea)
                .set('Authorization', 'Bearer ' + users[0].token);
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
            await helper.userRepository.areas(users[0].email).create({name: "Area1", enabled: true});
            await helper.userRepository.areas(users[0].email).create({name: "Area2", enabled: false});
            const res = await helper.client
                .get('/areas')
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(200);
            const body = res.body;
            expect(body).Array();
            expect(body).containDeep([{name: "Area1", enabled: true}, {name: "Area2", enabled: false}]);
        });

        it('Should return an empty array if there is none', async () => {
            const res = await helper.client
                .get('/areas')
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(200);
            const body = res.body;
            expect(body).Array();
            expect(body).empty();
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
            await helper.userRepository.areas(users[0].email).create(newArea);
            const res = await helper.client
                .get('/areas/count')
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(200);
            const body = res.body;
            expect(body.count).to.be.equal(1);
        });

        it('Should 0 if there is no area', async () => {
            const res = await helper.client
                .get('/areas/count')
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(200);
            const body = res.body;
            expect(body.count).to.be.equal(0);
        });

        it('Should send 401 Unauthorized for a request without token', async () => {
            const res = await helper.client
                .get('/areas/count')
                .expect(401);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Authorization header not found.');
        });
    });

    describe('GET /areas/{id}', () => {
        it('Should send the requested area', async () => {
            const area = await helper.userRepository.areas(users[0].email).create(newArea);

            const res = await helper.client
                .get('/areas/' + area.id)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(200);
            const body = res.body;

            expect(area.name).to.be.equal(body.name);
            expect(area.id?.toString()).to.be.equal(body.id);
            expect(area.enabled).to.be.equal(body.enabled);
            expect(area.ownerId).to.be.equal(body.ownerId);
        });

        it('Should send 404 Not Found if the id doesn\'t match', async () => {
            await helper.userRepository.areas(users[0].email).create(newArea);

            const res = await helper.client
                .get('/areas/NOT_AN_ID')
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Area not found');
        });

        it('Should send 404 Not Found if the area belongs to another user', async () => {
            const area = await helper.userRepository.areas(users[0].email).create(newArea);

            const res = await helper.client
                .get('/areas/' + area.id)
                .set('Authorization', 'Bearer ' + users[1].token)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Area not found');
        });

        it('Should send 401 Unauthorized for a request without token', async () => {
            const res = await helper.client
                .get('/areas/NOT_AN_ID')
                .expect(401);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Authorization header not found.');
        });
    });

    describe('DELETE /areas/{id}', () => {
        it('Should delete the specified area', async () => {
            const area = await helper.userRepository.areas(users[0].email).create(newArea);

            await helper.client
                .delete('/areas/' + area.id)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(204);
            expect((await helper.areaRepository.count({id: area.id})).count).to.be.equal(0);
        });

        it('Should delete actions belonging to the area', async () => {
            const area = await helper.userRepository.areas(users[0].email).create(newArea);
            const action = await helper.areaRepository.action(area.id).create({
                serviceAction: 'example.A.example'
            });

            expect((await helper.areaRepository.count({id: area.id})).count).to.be.equal(1);
            expect((await helper.actionRepository.count({id: action.id})).count).to.be.equal(1);

            await helper.client
                .delete('/areas/' + area.id)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(204);
            expect((await helper.areaRepository.count({id: area.id})).count).to.be.equal(0);
            expect((await helper.actionRepository.count({id: action.id})).count).to.be.equal(0);
        });

        it('Should delete reactions belonging to the area', async () => {
            const area = await helper.userRepository.areas(users[0].email).create(newArea);
            const reaction = await helper.areaRepository.reactions(area.id).create({
                serviceReaction: 'example.R.example'
            });

            expect((await helper.areaRepository.count({id: area.id})).count).to.be.equal(1);
            expect((await helper.reactionRepository.count({id: reaction.id})).count).to.be.equal(1);

            await helper.client
                .delete('/areas/' + area.id)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(204);
            expect((await helper.areaRepository.count({id: area.id})).count).to.be.equal(0);
            expect((await helper.actionRepository.count({id: reaction.id})).count).to.be.equal(0);
        });

        it('Should send 404 Not Found if the id doesn\'t match', async () => {
            await helper.userRepository.areas(users[0].email).create(newArea);

            const res = await helper.client
                .delete('/areas/NOT_AN_ID')
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Area not found');
        });

        it('Should send 404 Not Found if the area belongs to another user', async () => {
            const area = await helper.userRepository.areas(users[0].email).create(newArea);

            const res = await helper.client
                .delete('/areas/' + area.id)
                .set('Authorization', 'Bearer ' + users[1].token)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Area not found');
        });

        it('Should send 401 Unauthorized for a request without token', async () => {
            const res = await helper.client
                .delete('/areas/NOT_AN_ID')
                .expect(401);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Authorization header not found.');
        });
    });

    describe('PATCH /areas/{id}', () => {
        const patchData = {
            name: "PATCHED"
        };

        it('Should update the specified area', async () => {
            const area = await helper.userRepository.areas(users[0].email).create(newArea);

            const res = await helper.client
                .patch('/areas/' + area.id)
                .send(patchData)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(200);
            const body = res.body;
            expect(body.name).to.be.equal(patchData.name);
            expect(body.enabled).to.be.equal(area.enabled);
            expect(body.ownerId).to.be.equal(area.ownerId);
        });

        it('Should send 404 Not Found if the id doesn\'t match', async () => {
            await helper.userRepository.areas(users[0].email).create(newArea);

            const res = await helper.client
                .patch('/areas/NOT_AN_ID')
                .send(patchData)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Area not found');
        });

        it('Should send 404 Not Found if the area belongs to another user', async () => {
            const area = await helper.userRepository.areas(users[0].email).create(newArea);

            const res = await helper.client
                .patch('/areas/' + area.id)
                .send(patchData)
                .set('Authorization', 'Bearer ' + users[1].token)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Area not found');
        });

        it('Should send 401 Unauthorized for a request without token', async () => {
            const res = await helper.client
                .patch('/areas/NOT_AN_ID')
                .expect(401);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Authorization header not found.');
        });
    });

    describe('PATCH /areas/enable/{id}', () => {
        it('Should enable the specified area', async () => {
            const area = await helper.userRepository.areas(users[0].email).create({
                name: "NAME",
                enabled: false
            });

            const res = await helper.client
                .patch('/areas/enable/' + area.id)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(200);
            const body = res.body;
            expect(body.name).to.be.equal(area.name);
            expect(body.enabled).to.be.equal(true);
            expect(body.ownerId).to.be.equal(area.ownerId);
        });

        it('Should let enabled the specified area if it was already enabled', async () => {
            const area = await helper.userRepository.areas(users[0].email).create({
                name: "NAME",
                enabled: true
            });

            const res = await helper.client
                .patch('/areas/enable/' + area.id)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(200);
            const body = res.body;
            expect(body.name).to.be.equal(area.name);
            expect(body.enabled).to.be.equal(true);
            expect(body.ownerId).to.be.equal(area.ownerId);
        });

        it('Should send 404 Not Found if the id doesn\'t match', async () => {
            await helper.userRepository.areas(users[0].email).create(newArea);

            const res = await helper.client
                .patch('/areas/enable/NOT_AN_ID')
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Area not found');
        });

        it('Should send 404 Not Found if the area belongs to another user', async () => {
            const area = await helper.userRepository.areas(users[0].email).create(newArea);

            const res = await helper.client
                .patch('/areas/enable/' + area.id)
                .set('Authorization', 'Bearer ' + users[1].token)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Area not found');
        });

        it('Should send 401 Unauthorized for a request without token', async () => {
            const res = await helper.client
                .patch('/areas/enable/NOT_AN_ID')
                .expect(401);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Authorization header not found.');
        });
    });

    describe('PATCH /areas/disable/{id}', () => {
        it('Should disable the specified area', async () => {
            const area = await helper.userRepository.areas(users[0].email).create({
                name: "NAME",
                enabled: true
            });

            const res = await helper.client
                .patch('/areas/disable/' + area.id)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(200);
            const body = res.body;
            expect(body.name).to.be.equal(area.name);
            expect(body.enabled).to.be.equal(false);
            expect(body.ownerId).to.be.equal(area.ownerId);
        });

        it('Should let disabled the specified area if it was already disabled', async () => {
            const area = await helper.userRepository.areas(users[0].email).create({
                name: "NAME",
                enabled: false
            });

            const res = await helper.client
                .patch('/areas/disable/' + area.id)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(200);
            const body = res.body;
            expect(body.name).to.be.equal(area.name);
            expect(body.enabled).to.be.equal(false);
            expect(body.ownerId).to.be.equal(area.ownerId);
        });

        it('Should send 404 Not Found if the id doesn\'t match', async () => {
            await helper.userRepository.areas(users[0].email).create(newArea);

            const res = await helper.client
                .patch('/areas/disable/NOT_AN_ID')
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Area not found');
        });

        it('Should send 404 Not Found if the area belongs to another user', async () => {
            const area = await helper.userRepository.areas(users[0].email).create(newArea);

            const res = await helper.client
                .patch('/areas/disable/' + area.id)
                .set('Authorization', 'Bearer ' + users[1].token)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Area not found');
        });

        it('Should send 401 Unauthorized for a request without token', async () => {
            const res = await helper.client
                .patch('/areas/disable/NOT_AN_ID')
                .expect(401);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Authorization header not found.');
        });
    });
});
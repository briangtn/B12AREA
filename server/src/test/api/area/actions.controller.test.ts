import {TestHelper} from "../../acceptance/test-helper";
import {ActionRepository, AreaRepository} from "../../../repositories";
import {Action, Area} from "../../../models";
import {expect} from "@loopback/testlab";

describe('/areas/{id}/action', () => {
    const helper: TestHelper = new TestHelper();
    let areaRepo: AreaRepository;
    let actionRepo: ActionRepository;

    let area: Area;
    let action: Action;

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

    async function createAreaAndAction() {
        area = await helper.userRepository.areas(users[0].email).create({name: "Area1", enabled: true});
        action = await areaRepo.action(area.id).create({
            serviceAction: 'example.A.example',
        });
    }

    before('setupApplication', async() => {
        await helper.initTestHelper();
        actionRepo = await helper.app.get('repositories.ActionRepository');
        areaRepo = await helper.app.get('repositories.AreaRepository');
        await helper.createUser(users[0].email, users[0].password, false);
        await helper.createUser(users[1].email, users[0].password, false);
    });
    beforeEach(async () => {
        users[0].token = await helper.getJWT(users[0].email, users[0].password);
        users[1].token = await helper.getJWT(users[1].email, users[1].password);
    });

    after(async () => {
        await actionRepo.deleteAll();
        await areaRepo.deleteAll();
        await helper.userRepository.deleteAll();
        await helper.stop();
    });

    describe('GET /areas/{id}/action', () => {
        it('Should return 200 with the action if present', async () => {
            await createAreaAndAction();

            const res = await helper.client
                .get(`/areas/${area.id}/action`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(200);
            const body = res.body;
            expect(body.serviceAction).to.be.equal(action.serviceAction);
            expect(body.areaId).to.be.equal(action.areaId);
        });

        it('Should return 204 if there is no action for the area', async () => {
            await actionRepo.deleteAll();

            const res = await helper.client
                .get(`/areas/${area.id}/action`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(204);
            const body = res.body;
            expect(body).to.be.empty();
            expect((await actionRepo.count()).count).to.be.equal(0);
        });

        it('Should send 404 Not Found if the id doesn\'t match', async () => {
            const res = await helper.client
                .get(`/areas/NOT_AN_ID/action`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Entity not found: Area with id "NOT_AN_ID"');
        });

        it('Should send 404 Not Found if the area belongs to another user', async () => {
            const res = await helper.client
                .get(`/areas/${area.id}/action`)
                .set('Authorization', 'Bearer ' + users[1].token)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.containEql(`Area not found`);
        });

        it('Should send 401 Unauthorized for a request without token', async () => {
            const res = await helper.client
                .get(`/areas/${area.id}/action`)
                .expect(401);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Authorization header not found.');
        });
    });

    describe('DELETE /areas/{id}/action', () => {
        beforeEach(async () => {
            await createAreaAndAction();
        });

        it('Should return 200 on delete', async () => {
            expect((await actionRepo.count()).count).to.be.equal(1);
            const res = await helper.client
                .delete(`/areas/${area.id}/action`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(200);
            const body = res.body;
            expect(body.count).to.be.equal(1);
            expect((await actionRepo.count()).count).to.be.equal(0);
        });

        it('Should return 200 if there is no action for the area', async () => {
            await actionRepo.deleteAll();
            expect((await actionRepo.count()).count).to.be.equal(0);
            const res = await helper.client
                .delete(`/areas/${area.id}/action`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(200);
            const body = res.body;
            expect(body.count).to.be.equal(0);
            expect((await actionRepo.count()).count).to.be.equal(0);
        });

        it('Should send 404 Not Found if the id doesn\'t match', async () => {
            const res = await helper.client
                .delete(`/areas/NOT_AN_ID/action`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.containEql('Entity not found: Area with id "NOT_AN_ID"');
        });

        it('Should send 404 Not Found if the area belongs to another user', async () => {
            const res = await helper.client
                .delete(`/areas/${area.id}/action`)
                .set('Authorization', 'Bearer ' + users[1].token)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.containEql('Area not found');
        });

        it('Should send 401 Unauthorized for a request without token', async () => {
            const res = await helper.client
                .delete(`/areas/${area.id}/action`)
                .expect(401);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Authorization header not found.');
        });
    });

    describe('POST /areas/{id}/action', () => {
        const postAction = {
            serviceAction: "example.A.example"
        } as Action;

        beforeEach(async () => {
            await areaRepo.deleteAll();
            await actionRepo.deleteAll();
            area = await helper.userRepository.areas(users[0].email).create({name: "Area1", enabled: true});
        });

        it('Should return 200 with the created action', async () => {
            expect((await actionRepo.count()).count).to.be.equal(0);
            const res = await helper.client
                .post(`/areas/${area.id}/action`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .send(postAction)
                .expect(200);
            const body = res.body;
            expect(body).to.containDeep({serviceAction: "example.A.example"});
            expect(body).to.containDeep({areaId: area.id!.toString()});
            expect((await actionRepo.count()).count).to.be.equal(1);
        });

        //TODO Check invalid actionType / invalid options for this action type

        it('Should return 409 Conflict if there is already an action', async () => {
            action = await areaRepo.action(area.id).create({
                serviceAction: 'example.A.example',
            });

            expect((await actionRepo.count()).count).to.be.equal(1);
            const res = await helper.client
                .post(`/areas/${area.id}/action`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .send(postAction)
                .expect(409);//TODO
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.containEql('Action already exists for this area');
            expect((await actionRepo.count()).count).to.be.equal(1);
        });

        it('Should send 404 Not Found if the id doesn\'t match', async () => {
            const res = await helper.client
                .post(`/areas/NOT_AN_ID/action`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .send(postAction)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.containEql('Entity not found: Area with id "NOT_AN_ID"');
        });

        it('Should send 404 Not Found if the area belongs to another user', async () => {
            action = await areaRepo.action(area.id).create({
                serviceAction: 'example.A.example',
            });

            const res = await helper.client
                .post(`/areas/${area.id}/action`)
                .set('Authorization', 'Bearer ' + users[1].token)
                .send(postAction)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.containEql('Area not found');
        });

        it('Should send 401 Unauthorized for a request without token', async () => {
            const res = await helper.client
                .post(`/areas/${area.id}/action`)
                .send({} as Action)
                .expect(401);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Authorization header not found.');
        });
    });

    describe('PATCH /areas/{id}/action', () => {
        beforeEach(async () => {
            await areaRepo.deleteAll();
            await actionRepo.deleteAll();
            await createAreaAndAction();
        });

        const patchAction = {
            serviceAction: "example.A.examplePatched"
        } as Action;

        it('Should return 200 with the patched action', async () => {
            expect((await actionRepo.count()).count).to.be.equal(1);
            const res = await helper.client
                .patch(`/areas/${area.id}/action`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .send(patchAction)
                .expect(200);
            const body = res.body;
            expect(body).to.containDeep({id: action.id!.toString()});
            expect(body).to.containDeep({serviceAction: "example.A.examplePatched"});
            expect(body).to.containDeep({areaId: area.id!.toString()});
            expect((await actionRepo.count()).count).to.be.equal(1);
        });

        //TODO Check invalid actionType / invalid options for this action type

        it('Should send 404 Not Found if the id doesn\'t match', async () => {
            const res = await helper.client
                .patch(`/areas/NOT_AN_ID/action`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .send(patchAction)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.containEql('Entity not found: Area with id "NOT_AN_ID"');
        });

        it('Should send 404 Not Found if the area belongs to another user', async () => {
            const res = await helper.client
                .patch(`/areas/${area.id}/action`)
                .set('Authorization', 'Bearer ' + users[1].token)
                .send(patchAction)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.containEql('Area not found');
        });

        it('Should send 401 Unauthorized for a request without token', async () => {
            const res = await helper.client
                .patch(`/areas/${area.id}/action`)
                .send({} as Action)
                .expect(401);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Authorization header not found.');
        });
    });
});
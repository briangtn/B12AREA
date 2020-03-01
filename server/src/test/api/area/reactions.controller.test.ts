import {TestHelper} from "../../acceptance/test-helper";
import {ReactionRepository, AreaRepository} from "../../../repositories";
import {Reaction, Area} from "../../../models";
import {expect} from "@loopback/testlab";

describe('/areas/{id}/reactions', () => {
    const helper: TestHelper = new TestHelper();
    let areaRepo: AreaRepository;
    let reactionRepo: ReactionRepository;

    let area: Area;
    let reaction: Reaction;

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

    async function createReaction() {
        reaction = await areaRepo.reactions(area.id).create({
            serviceReaction: 'example.A.example',
        });
    }

    async function createAreaAndReaction() {
        area = await helper.userRepository.areas(users[0].email).create({name: "Area1", enabled: true});
        await createReaction();
    }

    before('setupApplication', async() => {
        await helper.initTestHelper();
        reactionRepo = await helper.app.get('repositories.ReactionRepository');
        areaRepo = await helper.app.get('repositories.AreaRepository');
        await helper.createUser(users[0].email, users[0].password, false);
        await helper.createUser(users[1].email, users[0].password, false);
    });

    beforeEach(async () => {
        users[0].token = await helper.getJWT(users[0].email, users[0].password);
        users[1].token = await helper.getJWT(users[1].email, users[1].password);
    });

    after(async () => {
        await reactionRepo.deleteAll();
        await areaRepo.deleteAll();
        await helper.userRepository.deleteAll();
        await helper.stop();
    });

    describe('GET /areas/{id}/reactions', () => {
        beforeEach(async () => {
            await createAreaAndReaction();
        });

        it('Should return 200 with an array of reactions', async () => {
            const res = await helper.client
                .get(`/areas/${area.id}/reactions`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(200);
            const body = res.body;
            expect(body).to.be.an.Array();
            expect(body.length).to.be.equal(1);
            expect(body[0].id).to.be.equal(reaction.id!.toString());
            expect(body[0].areaId).to.be.equal(reaction.areaId);
            expect(body[0].serviceReaction).to.be.equal(reaction.serviceReaction);
        });

        it('Should return 200 with an empty array if there is no reaction', async () => {
            await reactionRepo.deleteAll();
            const res = await helper.client
                .get(`/areas/${area.id}/reactions`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(200);
            const body = res.body;
            expect(body).to.be.an.Array();
            expect(body).to.be.empty();
        });

        it('Should send 404 Not Found if the id doesn\'t match', async () => {
            const res = await helper.client
                .get(`/areas/NOT_AN_ID/reactions`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Entity not found: Area with id "NOT_AN_ID"');
        });

        it('Should send 404 Not Found if the area belongs to another user', async () => {
            const res = await helper.client
                .get(`/areas/${area.id}/reactions`)
                .set('Authorization', 'Bearer ' + users[1].token)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.containEql(`Area not found`);
        });

        it('Should send 401 Unauthorized for a request without token', async () => {
            const res = await helper.client
                .get(`/areas/${area.id}/reactions`)
                .expect(401);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Authorization header not found.');
        });
    });

    describe('GET /areas/{id}/reactions/{id}', () => {
        beforeEach(async () => {
            await createAreaAndReaction();
        });

        it('Should return 200 with the specified reaction', async () => {
            const res = await helper.client
                .get(`/areas/${area.id}/reactions/${reaction.id}`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(200);
            const body = res.body;
            expect(body).to.be.an.Object();
            expect(body.id).to.be.equal(reaction.id!.toString());
            expect(body.areaId).to.be.equal(reaction.areaId);
            expect(body.serviceReaction).to.be.equal(reaction.serviceReaction);
        });

        it('Should send 404 Not Found if the area id doesn\'t match', async () => {
            const res = await helper.client
                .get(`/areas/NOT_AN_ID/reactions/${reaction.id}`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Entity not found: Area with id "NOT_AN_ID"');
        });

        it('Should send 404 Not Found if the reaction id doesn\'t match', async () => {
            const res = await helper.client
                .get(`/areas/${area.id}/reactions/NOT_AN_ID`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Entity not found: Reaction with id "NOT_AN_ID"');
        });

        it('Should send 404 Not Found if the area belongs to another user', async () => {
            const res = await helper.client
                .get(`/areas/${area.id}/reactions/${reaction.id}`)
                .set('Authorization', 'Bearer ' + users[1].token)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.containEql(`Area not found`);
        });

        it('Should send 401 Unauthorized for a request without token', async () => {
            const res = await helper.client
                .get(`/areas/${area.id}/reactions/${reaction.id}`)
                .expect(401);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Authorization header not found.');
        });
    });

    describe('DELETE /areas/{id}/reactions/{id}', () => {
        beforeEach(async () => {
            await areaRepo.deleteAll();
            await reactionRepo.deleteAll();
            await createAreaAndReaction();
        });

        it('Should return 200 on delete', async () => {
            expect((await reactionRepo.count()).count).to.be.equal(1);
            const res = await helper.client
                .delete(`/areas/${area.id}/reactions/${reaction.id}`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(200);
            const body = res.body;
            expect(body.count).to.be.equal(1);
            expect((await reactionRepo.count()).count).to.be.equal(0);
        });

        it('Should return 404 if there is no reaction for the area', async () => {
            await reactionRepo.deleteAll();
            expect((await reactionRepo.count()).count).to.be.equal(0);
            const res = await helper.client
                .delete(`/areas/${area.id}/reactions/${reaction.id}`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.containEql('Reaction not found');
        });

        it('Should send 404 Not Found if the area id doesn\'t match', async () => {
            const res = await helper.client
                .delete(`/areas/NOT_AN_ID/reactions/${reaction.id}`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.containEql('Entity not found: Area with id "NOT_AN_ID"');
        });

        it('Should send 404 Not Found if the reaction id doesn\'t match', async () => {
            const res = await helper.client
                .delete(`/areas/${area.id}/reactions/NOT_AN_ID`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.containEql('Reaction not found');
        });

        it('Should send 404 Not Found if the area belongs to another user', async () => {
            const res = await helper.client
                .delete(`/areas/${area.id}/reactions/${reaction.id}`)
                .set('Authorization', 'Bearer ' + users[1].token)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.containEql('Area not found');
        });

        it('Should send 401 Unauthorized for a request without token', async () => {
            const res = await helper.client
                .delete(`/areas/${area.id}/reactions/${reaction.id}`)
                .expect(401);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Authorization header not found.');
        });
    });

    describe('POST /areas/{id}/reactions', () => {
        const postReaction = {
            serviceReaction: "example.A.example"
        } as Reaction;

        beforeEach(async () => {
            await areaRepo.deleteAll();
            await reactionRepo.deleteAll();
            area = await helper.userRepository.areas(users[0].email).create({name: "Area1", enabled: true});
        });

        it('Should return 200 with the created reaction', async () => {
            expect((await reactionRepo.count()).count).to.be.equal(0);
            const res = await helper.client
                .post(`/areas/${area.id}/reactions`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .send(postReaction)
                .expect(200);
            const body = res.body;
            expect(body.serviceReaction).to.be.equal(postReaction.serviceReaction);
            expect(body.areaId).to.be.equal(area.id!.toString());
            expect((await reactionRepo.count()).count).to.be.equal(1);
        });

        it('Should return 200 if there is already a reaction', async () => {
            reaction = await areaRepo.reactions(area.id).create({
                serviceReaction: 'example.A.example',
            });

            expect((await reactionRepo.count()).count).to.be.equal(1);
            const res = await helper.client
                .post(`/areas/${area.id}/reactions`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .send(postReaction)
                .expect(200);
            const body = res.body;
            expect(body.serviceReaction).to.be.equal(postReaction.serviceReaction);
            expect(body.areaId).to.be.equal(area.id!.toString());
            expect((await reactionRepo.count()).count).to.be.equal(2);
        });

        it('Should send 404 Not Found if the id doesn\'t match', async () => {
            const res = await helper.client
                .post(`/areas/NOT_AN_ID/reactions`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .send(postReaction)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.containEql('Entity not found: Area with id "NOT_AN_ID"');
        });

        it('Should send 404 Not Found if the area belongs to another user', async () => {
            reaction = await areaRepo.reactions(area.id).create({
                serviceReaction: 'example.A.example',
            });

            const res = await helper.client
                .post(`/areas/${area.id}/reactions`)
                .set('Authorization', 'Bearer ' + users[1].token)
                .send(postReaction)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.containEql('Area not found');
        });

        it('Should send 401 Unauthorized for a request without token', async () => {
            const res = await helper.client
                .post(`/areas/${area.id}/reactions`)
                .send({} as Reaction)
                .expect(401);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Authorization header not found.');
        });
    });

    describe('PATCH /areas/{id}/reactions/{id}', () => {
        beforeEach(async () => {
            await areaRepo.deleteAll();
            await reactionRepo.deleteAll();
            await createAreaAndReaction();
        });

        const patchReaction = {
            options: {a: "OPTION"}
        } as Reaction;

        it('Should return 200 with the patched reaction', async () => {
            expect((await reactionRepo.count()).count).to.be.equal(1);
            const res = await helper.client
                .patch(`/areas/${area.id}/reactions/${reaction.id}`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .send(patchReaction)
                .expect(200);
            const body = res.body;
            expect(body).to.containDeep({id: reaction.id!.toString()});
            expect(body).to.containDeep({options: {a: "OPTION"}});
            expect(body).to.containDeep({areaId: area.id!.toString()});
            expect((await reactionRepo.count()).count).to.be.equal(1);
        });

        it ('Should return a 400 Bad Request when changing the serviceReaction', async () => {
            expect((await reactionRepo.count()).count).to.be.equal(1);
            await helper.client
                .patch(`/areas/${area.id}/reactions/${reaction.id}`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .send({
                    serviceReaction: "example.R.examplePatched"
                })
                .expect(400);
            expect((await reactionRepo.count()).count).to.be.equal(1);
        });

        it('Should send 404 Not Found if the area id doesn\'t match', async () => {
            const res = await helper.client
                .patch(`/areas/NOT_AN_ID/reactions/${reaction.id}`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .send(patchReaction)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.containEql('Entity not found: Area with id "NOT_AN_ID"');
        });

        it('Should send 404 Not Found if the reaction id doesn\'t match', async () => {
            const res = await helper.client
                .patch(`/areas/${area.id}/reactions/NOT_AN_ID`)
                .set('Authorization', 'Bearer ' + users[0].token)
                .send(patchReaction)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.containEql('Entity not found: Reaction with id "NOT_AN_ID"');
        });

        it('Should send 404 Not Found if the area belongs to another user', async () => {
            const res = await helper.client
                .patch(`/areas/${area.id}/reactions/${reaction.id}`)
                .set('Authorization', 'Bearer ' + users[1].token)
                .send(patchReaction)
                .expect(404);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.containEql('Area not found');
        });

        it('Should send 401 Unauthorized for a request without token', async () => {
            const res = await helper.client
                .patch(`/areas/${area.id}/reactions/${reaction.id}`)
                .send({} as Reaction)
                .expect(401);
            const error = JSON.parse(res.error.text);
            expect(error.error.message).to.equal('Authorization header not found.');
        });
    });
});
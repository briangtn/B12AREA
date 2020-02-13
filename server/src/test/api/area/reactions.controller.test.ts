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
});
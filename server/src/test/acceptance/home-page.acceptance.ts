import {TestHelper} from './test-helper';

describe('HomePage', () => {
    const helper: TestHelper = new TestHelper();

    before('setupApplication', async () => {
        await helper.initTestHelper();
    });

    after(async () => {
        await helper.stop();
    });

    it('exposes a default home page', async () => {
        await helper.client
            .get('/')
            .expect(200)
            .expect('Content-Type', /text\/html/);
    });

    it('exposes self-hosted explorer', async () => {
        await helper.client
            .get('/explorer/')
            .expect(200)
            .expect('Content-Type', /text\/html/)
            .expect(/<title>LoopBack API Explorer/);
    });
});

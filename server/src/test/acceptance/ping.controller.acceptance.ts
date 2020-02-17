import {expect} from '@loopback/testlab';
import {TestHelper} from './test-helper';

describe('PingController', () => {
    const helper: TestHelper = new TestHelper();

    before('setupApplication', async () => {
        await helper.initTestHelper();
    });

    after(async () => {
        await helper.stop();
    });

    it('invokes GET /ping', async () => {
        const res = await helper.client.get('/ping?msg=world').expect(200);
        expect(res.body).to.containEql({greeting: 'Hello from LoopBack'});
    });
});

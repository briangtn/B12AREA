import {TestHelper} from '../acceptance/test-helper';

describe('Ready', () => {
    const helper: TestHelper = new TestHelper();

    before('setupApplication', async () => {
        await helper.initTestHelper();
    });

    after(async () => {
        await helper.stop();
    });

    it('expose a ready page (return 200 and write true)', async () => {
        await helper.client
            .get('/readinessProbe')
            .expect(200).expect('true');
    });
});
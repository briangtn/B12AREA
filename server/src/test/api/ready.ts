import {Client} from '@loopback/testlab';
import {AreaApplication} from '../..';
import {setupApplication} from '../acceptance/test-helper';

describe('Ready', () => {
    let app: AreaApplication;
    let client: Client;

    before('setupApplication', async () => {
        ({app, client} = await setupApplication());
    });

    after(async () => {
        await app.stop();
    });

    it('expose a ready page (return 200 and write true)', async () => {
        await client
            .get('/readinessProbe')
            .expect(200).expect('true');
    });
});
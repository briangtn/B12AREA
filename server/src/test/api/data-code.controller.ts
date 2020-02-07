import {AreaApplication} from '../../application';
import {setupApplication} from '../acceptance/test-helper';
import { Client, expect } from '@loopback/testlab';
import {DataExchangeCodeRepository} from '../../repositories';
import { ExchangeCodeGeneratorManager } from '../../services';

describe('/users', () => {
    let app: AreaApplication;
    let client: Client;

    let dataCodeRepo: DataExchangeCodeRepository;
    let generator: ExchangeCodeGeneratorManager;

    before('setupApplication', async() => {
        ({app, client} = await setupApplication());
        dataCodeRepo = await app.get('repositories.DataExchangeCodeRepository');
        generator = await app.get('services.exchangeCodeGenerator');
    });
    before(migrateSchema);
    beforeEach(async () => {
        await dataCodeRepo.deleteAll();
    });

    after(async () => {
        await app.stop();
    });

    describe('GET /data-code/{code}', () => {
        it('Should return 200 (public)', async () => {
            const data = {name: "Hello", password: "p@ssword"};
            const code = await generator.generate(data, true);

            const res = await client
                .get('/data-code/' + code)
                .expect(200);
            const body = res.body;
            expect(JSON.stringify(body)).to.equal(JSON.stringify(data));
        });

        it('Should return 404 (private)', async () => {
            const data = {name: "Hello", password: "p@ssword"};
            const code = await generator.generate(data, false);

            await client
                .get('/data-code/' + code)
                .expect(404);
        });

        it('Should return 404 (Not exist)', async () => {
            await client
                .get('/data-code/not_exist')
                .expect(404);
        });
    });

    async function migrateSchema() {
        await app.migrateSchema();
    }
});
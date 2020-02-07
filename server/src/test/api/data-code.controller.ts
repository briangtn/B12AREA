import {TestHelper} from '../acceptance/test-helper';
import {expect} from '@loopback/testlab';
import {DataExchangeCodeRepository} from '../../repositories';
import { ExchangeCodeGeneratorManager } from '../../services';

describe('/users', () => {
    const helper: TestHelper = new TestHelper();

    let dataCodeRepo: DataExchangeCodeRepository;
    let generator: ExchangeCodeGeneratorManager;

    before('setupApplication', async() => {
        await helper.initTestHelper();
        dataCodeRepo = await helper.app.get('repositories.DataExchangeCodeRepository');
        generator = await helper.app.get('services.exchangeCodeGenerator');
    });
    beforeEach(async () => {
        await dataCodeRepo.deleteAll();
    });

    after(async () => {
        await helper.stop();
    });

    describe('GET /data_code/{code}', () => {
        it('Should return 200 (public)', async () => {
            const data = {name: "Hello", password: "p@ssword"};
            const code = await generator.generate(data, true);

            const res = await helper.client
                .get('/data_code/' + code)
                .expect(200);
            const body = res.body;
            expect(JSON.stringify(body)).to.equal(JSON.stringify(data));
        });

        it('Should return 404 (private)', async () => {
            const data = {name: "Hello", password: "p@ssword"};
            const code = await generator.generate(data, false);

            await helper.client
                .get('/data_code/' + code)
                .expect(404);
        });

        it('Should return 404 (Not exist)', async () => {
            await helper.client
                .get('/data_code/not_exist')
                .expect(404);
        });
    });
});
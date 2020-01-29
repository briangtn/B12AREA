import { api, get, param, HttpErrors } from "@loopback/rest";
import {ExchangeCodeGeneratorManager} from '../services';
import { inject } from "@loopback/context";
import {response404} from './specs/doc.specs';

// Uncomment these imports to begin using these cool features!

// import {inject} from '@loopback/context';

@api({basePath: '/data_code', paths: {}})
export class DataCodeController {
    constructor(@inject('services.exchangeCodeGenerator') protected exchangeCodeGenerator: ExchangeCodeGeneratorManager) {}

    @get('/{code}', {
        responses: {
            '200': {
                description: 'The data linked to this code'
            },
            '404': response404('Data for this code not found.')
        }
    })
    async getDataFromCode(@param.path.string('code') code: string) {
        const data: object | null = await this.exchangeCodeGenerator.getData(code, true, true);

        if (!data) {
            throw new HttpErrors.NotFound('Data for this code not found');
        }
        return data;
    }
}

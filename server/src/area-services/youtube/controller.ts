import {LoginObject, ServiceConfig} from "../../services-interfaces";
import config from './config.json';
import {param, get, Response, RestBindings} from "@loopback/rest";
import {Context, inject} from "@loopback/context";
import {ExchangeCodeGeneratorManager} from "../../services";

export default class ServiceController {

    constructor(
        @inject('services.exchangeCodeGenerator') protected exchangeCodeGenerator: ExchangeCodeGeneratorManager,
        @inject(RestBindings.Http.RESPONSE) public response: Response,
    ) {
    }

    static async start(ctx: Context): Promise<void> {
        console.log('Starting youtube service');
    }

    static async login(params: LoginObject): Promise<string> {
        return ""
    }

    static async getConfig(): Promise<ServiceConfig> {
        return config;
    }

    @get('/oauth', {
        responses: {
            '200': {
                description: 'OAuth received'
            }
        }
    })
    async oauth(@param.query.string('code') code?: string,
                @param.query.string('state') state?: string,
                @param.query.string('error') error?: string
    ): Promise<void> {
        if (error || !code || !state) {
            console.error('error', error, code, state);
            return;
        }
    }
}
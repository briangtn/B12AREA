import {LoginObject, ServiceConfig} from "../../services-interfaces";
import config from './config.json';
import {param, get, Response, RestBindings} from "@loopback/rest";
import {Context, inject} from "@loopback/context";
import {CustomUserProfile, ExchangeCodeGeneratorManager} from "../../services";
import {UserRepository} from "../../repositories";
import {User} from "../../models";
import axios from "axios";
import {repository} from "@loopback/repository";
import {TokensResponse} from "./interfaces";

const API_URL : string = process.env.API_URL ?? "http://localhost:8080";
const GOOGLE_AUTHORIZE_BASE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export default class ServiceController {
    static serviceName = 'youtube';

    constructor(
        @inject('services.exchangeCodeGenerator') protected exchangeCodeGenerator: ExchangeCodeGeneratorManager,
        @inject(RestBindings.Http.RESPONSE) public response: Response,
        @repository(UserRepository) private userRepository: UserRepository
    ) {
    }

    static async start(ctx: Context): Promise<void> {
        console.log('Starting youtube service');
    }

    static async login(params: LoginObject): Promise<string> {
        const userRepository: UserRepository = await params.ctx.get('repositories.UserRepository');
        const exchangeCodeGenerator: ExchangeCodeGeneratorManager = await params.ctx.get('services.exchangeCodeGenerator');
        const user : User = (await userRepository.findOne({where: {email: params.user.email}}))!;

        if (user.services && user.services[this.serviceName as keyof typeof user.services]) {
            //REFRESH YT TOKEN ??
        }

        if (await userRepository.getServiceInformation(user.id, this.serviceName)) {
            const codeParam = await exchangeCodeGenerator.generate({status: `Authenticated with ${this.serviceName}`}, true);
            return params.redirectUrl + '?code=' + codeParam;
        }

        const endApiRedirectUrl = API_URL + `/services/${this.serviceName}/oauth`;
        const state = await exchangeCodeGenerator.generate({url: params.redirectUrl, user: params.user, redirectedUri: endApiRedirectUrl}, false);

        let googleRedirectUrl = GOOGLE_AUTHORIZE_BASE_URL;
        googleRedirectUrl += '?scope=https://www.googleapis.com/auth/youtube';
        googleRedirectUrl += '&access_type=online';
        googleRedirectUrl += '&redirect_uri=' + endApiRedirectUrl;
        googleRedirectUrl += '&response_type=code';
        googleRedirectUrl += '&client_id=' + GOOGLE_CLIENT_ID;
        googleRedirectUrl += '&state=' + state;
        return googleRedirectUrl;
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
        if (!code || !state) {
            console.error('error', code, state);
            return;
        }

        const dataCode = await this.exchangeCodeGenerator.getData(state, false, true);
        if (!dataCode || !('user' in dataCode) || !('redirectedUri' in dataCode) || !('url' in dataCode)) {
            return;
        }
        const data = dataCode as {redirectedUri: string, user: CustomUserProfile, url: string};
        try {
            const response =  await axios.post('https://oauth2.googleapis.com/token', {
                code,
                // eslint-disable-next-line @typescript-eslint/camelcase
                client_id: GOOGLE_CLIENT_ID,
                // eslint-disable-next-line @typescript-eslint/camelcase
                client_secret: GOOGLE_CLIENT_SECRET,
                // eslint-disable-next-line @typescript-eslint/camelcase
                redirect_uri: data.redirectedUri,
                // eslint-disable-next-line @typescript-eslint/camelcase
                grant_type: 'authorization_code',
            });
            const googleTokens: TokensResponse = response.data as TokensResponse;
            try {
                const user: User|null = (await this.userRepository.findOne({
                    where: {
                        email: data.user.email
                    }
                }));
                if (user == null) {
                    const codeParam = await this.exchangeCodeGenerator.generate({error: 'User not found', info: {cause: 'database could probably not be reached'}}, true);
                    return this.response.redirect(data.url + '?code=' + codeParam);
                }
                await this.userRepository.addService(user.id, {
                    ...googleTokens,
                    ...{
                        expiresAt: new Date().valueOf() + googleTokens.expires_in,
                    }
                }, ServiceController.serviceName);
            } catch (e) {
                const codeParam = await this.exchangeCodeGenerator.generate({error: `Failed to store ${ServiceController.serviceName} token`, info: e}, true);
                return this.response.redirect(data.url + '?code=' + codeParam);
            }
            const codeParam = await this.exchangeCodeGenerator.generate({status: `Authenticated with ${ServiceController.serviceName}`}, true);
            return this.response.redirect(data.url + '?code=' + codeParam);
        } catch(e) {
            console.error(e.response.data);
        }
    }
}
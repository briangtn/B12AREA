import {LoginObject, ServiceConfig} from "../../services-interfaces";
import config from './config.json';
import {Context, inject} from "@loopback/context";
import {ExchangeCodeGeneratorManager} from "../../services";
import {UserRepository} from "../../repositories";
import {User} from "../../models";
import {get, param, Response, RestBindings} from "@loopback/rest";
import {UserProfile} from "@loopback/security";
import {HttpErrors} from "@loopback/rest/dist";
import {OutlookHelper, OutlookTokens} from "./helper";
import {repository} from "@loopback/repository";

export default class ServiceController {

    constructor(
        @inject('services.exchangeCodeGenerator') protected exchangeCodeGenerator: ExchangeCodeGeneratorManager,
        @inject(RestBindings.Http.RESPONSE) public response: Response,
        @repository(UserRepository) public userRepository: UserRepository
    ) {}

    static async start(ctx: Context): Promise<void> {
        console.log('Starting outlook service');
    }

    static async login(params: LoginObject): Promise<string> {
        const userRepository: UserRepository = await params.ctx.get('repositories.UserRepository');
        const exchangeCodeGenerator: ExchangeCodeGeneratorManager = await params.ctx.get('services.exchangeCodeGenerator');

        const user : User = (await userRepository.findOne({where: {email: params.user.email}}))!;

        if (user.services && user.services["outlook" as keyof typeof user.services]) {
            try {
                await OutlookHelper.refreshTokensForUser(user, params.ctx);
                // eslint-disable-next-line no-empty
            } catch (e) {}
        }

        if (await userRepository.getServiceInformation(user.id, 'outlook')) {
            const codeParam = await exchangeCodeGenerator.generate({status: 'Authenticated with outlook'}, true);
            return params.redirectUrl + '?code=' + codeParam;
        }

        const baseRedirectUrl = OutlookHelper.generateLoginRedirectUrlWithoutState();
        const state = await exchangeCodeGenerator.generate({url: params.redirectUrl, user: params.user}, false);
        return `${baseRedirectUrl}&state=${state}`;
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
        if (!state) {
            console.error('error state not found', code);
            return;
        }
        const stateData = await this.exchangeCodeGenerator.getData(state, false, true) as {url: string; user: UserProfile};
        if (!stateData)
            throw new HttpErrors.UnprocessableEntity('State is invalid. Man in the middle?');
        if (error) {
            const codeParam = await this.exchangeCodeGenerator.generate({error: 'Failed to login to outlook', info: {error}}, true);
            return this.response.redirect(stateData.url + '?code=' + codeParam);
        }
        if (!code) {
            console.error('error code not found', state);
            return;
        }

        const user: User|null = (await this.userRepository.findOne({
            where: {
                email: stateData.user.email
            }
        }));
        if (user == null) {
            const codeParam = await this.exchangeCodeGenerator.generate({error: 'User not found', info: {cause: 'database could probably not be reached'}}, true);
            return this.response.redirect(stateData.url + '?code=' + codeParam);
        }

        try {
            const tokens: OutlookTokens = await OutlookHelper.exchangeCodeForTokens(code);
            try {
                await this.userRepository.addService(user.id, tokens, 'outlook');
            } catch (e) {
                const codeParam = await this.exchangeCodeGenerator.generate({error: 'Failed to store outlook token', info: e}, true);
                return this.response.redirect(stateData.url + '?code=' + codeParam);
            }
            const codeParam = await this.exchangeCodeGenerator.generate({status: 'Authenticated with outlook'}, true);
            return this.response.redirect(stateData.url + '?code=' + codeParam);
        } catch (e) {
            const codeParam = await this.exchangeCodeGenerator.generate(e, true);
            return this.response.redirect(stateData.url + '?code=' + codeParam);
        }
    }

    static async getConfig(): Promise<ServiceConfig> {
        return config;
    }
}
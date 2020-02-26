import {LoginObject, ServiceConfig} from "../../services-interfaces";
import config from './config.json';
import {param, get, Response, RestBindings} from "@loopback/rest";
import {Context, inject} from "@loopback/context";
import {CustomUserProfile, ExchangeCodeGeneratorManager} from "../../services";
import {ActionRepository, UserRepository} from "../../repositories";
import {Action, User} from "../../models";
import {repository} from "@loopback/repository";
import {NewVideoConfig, NewVideoData, TokensResponse} from "./interfaces";
import {YoutubeHelper} from "./YoutubeHelper";
import axios from "axios";
import DomParser from "dom-parser";

const API_URL : string = process.env.API_URL ?? "http://localhost:8080";

export default class ServiceController {
    static serviceName = 'youtube';

    constructor(
        @inject('services.exchangeCodeGenerator') protected exchangeCodeGenerator: ExchangeCodeGeneratorManager,
        @inject(RestBindings.Http.RESPONSE) public response: Response,
        @repository(UserRepository) private userRepository: UserRepository
    ) {
    }

    static async start(ctx: Context): Promise<void> {
        console.log(`Starting ${this.serviceName} service`);
        const actionRepository : ActionRepository = await ctx.get('repositories.ActionRepository');

        const youtubeActions : Action[] = await actionRepository.find({
            where: {
                serviceAction: `${this.serviceName}.A.new_video`
            }
        });
        for (const action of youtubeActions) {
            const channelId = (action.options as NewVideoConfig).channel;
            const webhook = (action.data as NewVideoData).webHookUrl;
            if (!webhook.startsWith(API_URL)) {
                console.log(webhook);
                console.log(API_URL);
                setTimeout(() => {
                    YoutubeHelper.updateWebhookAPIURL(action, channelId, ctx);
                }, 2000);
            } else {
                YoutubeHelper.prepareRefreshWebhook(channelId, webhook);
            }
        }
    }

    @get('/oauth', {
        responses: {
            '200': {
                description: 'OAuth received'
            }
        }
    })
    async oauth(@inject.context() ctx: Context,
        @param.query.string('code') code?: string,
        @param.query.string('state') state?: string,
        @param.query.string('error') error?: string,
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
            const tokens: TokensResponse = await YoutubeHelper.getToken(code, data.redirectedUri) as TokensResponse;
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
                await YoutubeHelper.updateToken(user.id!, tokens, ctx);
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

    static async login(params: LoginObject): Promise<string> {
        const userRepository: UserRepository = await params.ctx.get('repositories.UserRepository');
        const exchangeCodeGenerator: ExchangeCodeGeneratorManager = await params.ctx.get('services.exchangeCodeGenerator');
        const user: User = (await userRepository.findOne({where: {email: params.user.email}}))!;

        if (await userRepository.getServiceInformation(user.id, this.serviceName)) {
            const codeParam = await exchangeCodeGenerator.generate({status: `Authenticated with ${this.serviceName}`}, true);
            return params.redirectUrl + '?code=' + codeParam;
        }

        const endApiRedirectUrl = API_URL + `/services/${this.serviceName}/oauth`;
        const state = await exchangeCodeGenerator.generate({url: params.redirectUrl, user: params.user, redirectedUri: endApiRedirectUrl}, false);

        let googleRedirectUrl = YoutubeHelper.getAuthUrl(endApiRedirectUrl);
        googleRedirectUrl += '&state=' + state;
        return googleRedirectUrl;
    }

    static async getConfig(): Promise<ServiceConfig> {
        return config;
    }
}
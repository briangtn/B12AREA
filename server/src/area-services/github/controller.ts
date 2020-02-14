import {LoginObject, ServiceConfig} from "../../services-interfaces";
import config from './config.json';
import axios from 'axios';
import {param, get, Response, RestBindings} from "@loopback/rest";
import {Context, inject} from "@loopback/context";
import {ExchangeCodeGeneratorManager} from "../../services";
import {HttpErrors} from "@loopback/rest/dist";
import {repository} from "@loopback/repository";
import {GithubTokenRepository, GithubWebhookRepository, UserRepository} from "../../repositories";
import {GithubToken, GithubWebhook, User} from "../../models";
import {UserProfile} from "@loopback/security";
import {GithubWebhookResponse} from "./interfaces";

const GITHUB_AUTHORIZE_BASE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_EXCHANGE_BASE_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_API_BASE_URL = 'https://api.github.com';
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET ?? "";
const API_URL : string = process.env.API_URL ?? "http://localhost:8080";

export default class ServiceController {

    constructor(
        @inject('services.exchangeCodeGenerator') protected exchangeCodeGenerator: ExchangeCodeGeneratorManager,
        @inject(RestBindings.Http.RESPONSE) public response: Response,
        @repository(GithubTokenRepository) public githubTokenRepository: GithubTokenRepository,
        @repository(GithubWebhookRepository) public githubWebhookRepository: GithubWebhookRepository,
        @repository(UserRepository) public userRepository: UserRepository,
    ) {
    }

    static async start(ctx: Context): Promise<void> {
        console.log('Starting github service');
        let githubTokenRepository : GithubTokenRepository | undefined = undefined;
        let githubWebhookRepository : GithubWebhookRepository | undefined = undefined;
        try {
            githubTokenRepository = await ctx.get('repositories.GithubTokenRepository');
            githubWebhookRepository = await ctx.get('repositories.GithubWebhookRepository');
        } catch (e) {
            console.error('Failed to resolve github repositories on start', e);
            return;
        }
        if (!githubWebhookRepository || !githubTokenRepository) {
            console.error('Failed to resolve github repositories on start');
            return;
        }
        const webhooks : GithubWebhook[] = await githubWebhookRepository.find();
        for (const webhook of webhooks) {
            const webhookConfig : {content_type: string; insecure_ssl: string, url: string;} = webhook.config! as {content_type: string; insecure_ssl: string, url: string;};
            if (!webhookConfig.url.startsWith(API_URL)) {
                console.log(`Webhook ${webhook.id} invalid, updating!`);
                let githubToken : GithubToken | null = null;
                try {
                    githubToken = await githubTokenRepository.findOne({
                        where: {
                            userId: webhook.userId
                        }
                    }, {strictObjectIDCoercion: true});
                } catch (e) {
                    console.error(`Failed to find github token for user ${webhook.userId}`, e);
                    continue;
                }
                if (!githubToken) {
                    console.error(`Failed to find github token for user ${webhook.userId}`);
                    continue;
                }
                try {
                    const response : { data: GithubWebhookResponse } = await axios.patch(`${GITHUB_API_BASE_URL}/repos/${webhook.owner}/${webhook.repo}/hooks/${webhook.githubId}`, {
                        config: {
                            url: `${API_URL}/services/github/actions/push/webhook/${webhook.hookUuid}`,
                            // required by github
                            // eslint-disable-next-line @typescript-eslint/camelcase
                            content_type: 'json',
                            // eslint-disable-next-line @typescript-eslint/camelcase
                            insecure_ssl: '0'
                        }
                    }, {
                        headers: {
                            Authorization: `token ${githubToken.token}`
                        }
                    });
                    const updateData = {
                        hookUuid: webhook.hookUuid,
                        userId: webhook.userId,
                        owner: webhook.owner,
                        repo: webhook.repo,
                        type: response.data.type,
                        githubId: response.data.id,
                        name: response.data.name,
                        active: response.data.active,
                        events: response.data.events,
                        config: response.data.config,
                        updatedAt: response.data.updated_at,
                        createdAt: response.data.created_at,
                        url: response.data.url,
                        testUrl: response.data.test_url,
                        pingUrl: response.data.ping_url,
                        lastResponse: response.data.last_response
                    };
                    try {
                        await githubWebhookRepository.updateById(webhook.id, updateData);
                    } catch (e) {
                        console.error(`Error while updating database. This is realy bad you need to update database manually. Data is the following: ${JSON.stringify(updateData)}`);
                    }
                } catch (e) {
                    console.error(`Failed to contact github api`);
                }
            }
        }
    }

    static async login(params: LoginObject): Promise<string> {
        const userRepository: UserRepository = await params.ctx.get('repositories.UserRepository');
        const githubTokenRepository: GithubTokenRepository = await params.ctx.get('repositories.GithubTokenRepository');
        const exchangeCodeGenerator: ExchangeCodeGeneratorManager = await params.ctx.get('services.exchangeCodeGenerator');
        const user : User = (await userRepository.findOne({where: {email: params.user.email}}))!;
        const token: GithubToken | null = await githubTokenRepository.findOne({
            where: {
                userId: user.id
            }
        }, {strictObjectIDCoercion: true});
        if (token != null) {
            const codeParam = await exchangeCodeGenerator.generate({status: 'Authenticated with github'}, true);
            return params.redirectUrl + '?code=' + codeParam;
        }

        const baseApiURl = API_URL;
        const endApiRedirectUrl = baseApiURl + '/services/github/oauth';

        const state = await exchangeCodeGenerator.generate({url: params.redirectUrl, user: params.user}, false);

        let githubRedirectUrl = GITHUB_AUTHORIZE_BASE_URL;
        githubRedirectUrl += ('?client_id=' + GITHUB_CLIENT_ID);
        githubRedirectUrl += ('&redirect_uri=' + endApiRedirectUrl);
        githubRedirectUrl += ('&scope=repo user');
        githubRedirectUrl += ('&state=' + state);
        return githubRedirectUrl;
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
        const stateData = await this.exchangeCodeGenerator.getData(state, false, true) as {url: string; user: UserProfile;};
        if (!stateData)
            throw new HttpErrors.UnprocessableEntity('State is invalid. Man in the middle?');
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
            const tokens = await axios.post(GITHUB_TOKEN_EXCHANGE_BASE_URL, {
                // Required by github
                // eslint-disable-next-line @typescript-eslint/camelcase
                client_id: GITHUB_CLIENT_ID,
                // eslint-disable-next-line @typescript-eslint/camelcase
                client_secret: GITHUB_CLIENT_SECRET,
                code
            }, {
                headers: {
                    Accept: 'application/json'
                }
            }) as {data: {access_token: string, scope: string, token_type: string}};
            try {
                await this.githubTokenRepository.create({
                    token: tokens.data.access_token,
                    userId: user.id
                });
            } catch (e) {
                const codeParam = await this.exchangeCodeGenerator.generate({error: 'Failed to store github token', info: e}, true);
                return this.response.redirect(stateData.url + '?code=' + codeParam);
            }
            const codeParam = await this.exchangeCodeGenerator.generate({status: 'Authenticated with github'}, true);
            return this.response.redirect(stateData.url + '?code=' + codeParam);
        } catch (e) {
            const codeParam = await this.exchangeCodeGenerator.generate({error: 'Failed to contact github api', info: e.config}, true);
            return this.response.redirect(stateData.url + '?code=' + codeParam);
        }
    }
}
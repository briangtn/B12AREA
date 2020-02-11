import {LoginObject, ServiceConfig} from "../../services-interfaces";
import config from './config.json';
import axios from 'axios';
import {param, post, Response, RestBindings} from "@loopback/rest";
import {inject} from "@loopback/context";
import {ExchangeCodeGeneratorManager} from "../../services";
import {HttpErrors} from "@loopback/rest/dist";
import {repository} from "@loopback/repository";
import {GithubTokenRepository, UserRepository} from "../../repositories";
import {GithubToken, User} from "../../models";
import {UserProfile} from "@loopback/security";

const GITHUB_AUTHORIZE_BASE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_EXCHANGE_BASE_URL = 'https://github.com/login/oauth/access_token';

export default class ServiceController {

    constructor(
        @inject('services.exchangeCodeGenerator') protected exchangeCodeGenerator: ExchangeCodeGeneratorManager,
        @inject(RestBindings.Http.RESPONSE) public response: Response,
        @repository(GithubTokenRepository) public githubTokenRepository: GithubTokenRepository,
        @repository(UserRepository) public userRepository: UserRepository,
    ) {
    }

    static async start(): Promise<void> {
        console.log('Starting github service'); //todo: remove me
        //todo: here we should update existing webhooks with process.env.API_URL
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
        });
        if (token != null) {
            const codeParam = await exchangeCodeGenerator.generate({status: 'Authenticated with github'}, true);
            return params.redirectUrl + '?code=' + codeParam;
        }

        const baseApiURl = process.env.API_URL;
        const endApiRedirectUrl = baseApiURl + '/services/github/oauth';

        const state = await exchangeCodeGenerator.generate({url: params.redirectUrl, user: params.user}, false);

        let githubRedirectUrl = GITHUB_AUTHORIZE_BASE_URL;
        githubRedirectUrl += ('?client_id=' + process.env.GITHUB_CLIENT_ID);
        githubRedirectUrl += ('&redirect_uri=' + endApiRedirectUrl);
        githubRedirectUrl += ('&scope=repo user');
        githubRedirectUrl += ('&state=' + state);
        return githubRedirectUrl;
    }

    static getConfig(): ServiceConfig {
        return config;
    }

    @post('/oauth', {
        responses: {
            '200': {
                description: 'OAuth received'
            }
        }
    })
    async oauth(@param.query.string('code') code: string,
                @param.query.string('state') state: string
    ): Promise<void> {
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
                client_id: process.env.GITHUB_CLIENT_ID,
                // eslint-disable-next-line @typescript-eslint/camelcase
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code
            }, {
                headers: {
                    Accept: 'application/json'
                }
            }) as {access_token: string, scope: string, token_type: string};
            try {
                await this.githubTokenRepository.create({
                    token: tokens.access_token,
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
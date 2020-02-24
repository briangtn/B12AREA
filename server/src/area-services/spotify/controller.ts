import {LoginObject, ServiceConfig} from "../../services-interfaces";
import config from './config.json';
import axios from 'axios';
import base64 from 'base-64'
import {param, get, Response, RestBindings} from "@loopback/rest";
import {Context, inject} from "@loopback/context";
import {ExchangeCodeGeneratorManager, UserService} from "../../services";
import {HttpErrors} from "@loopback/rest/dist";
import {repository} from "@loopback/repository";
import {UserRepository} from "../../repositories";
import {User} from "../../models";
import {UserProfile} from "@loopback/security";
import * as qs from 'querystring'

const SPOTIFY_AUTHORIZE_BASE_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_EXCHANGE_BASE_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? "";
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? "";
const API_URL : string = process.env.API_URL ?? "http://localhost:8080";

export default class ServiceController {

    constructor(
        @inject('services.exchangeCodeGenerator') protected exchangeCodeGenerator: ExchangeCodeGeneratorManager,
        @inject(RestBindings.Http.RESPONSE) public response: Response,
        @repository(UserRepository) public userRepository: UserRepository,
    ) {
    }

    static async start(ctx: Context): Promise<void> {
    }

    static async login(params: LoginObject): Promise<string> {
        const userRepository: UserRepository = await params.ctx.get('repositories.UserRepository');
        const userService: UserService = await params.ctx.get('services.user');
        const exchangeCodeGenerator: ExchangeCodeGeneratorManager = await params.ctx.get('services.exchangeCodeGenerator');
        const user : User = (await userRepository.findOne({where: {email: params.user.email}}))!;

        if (userService.getServiceLoginData(user, 'spotify')) {
            const codeParam = await exchangeCodeGenerator.generate({status: 'Authenticated with spotify'}, true);
            return params.redirectUrl + '?code=' + codeParam;
        }
        const baseApiURl = API_URL;
        const endApiRedirectUrl = baseApiURl + '/services/spotify/oauth';

        const state = await exchangeCodeGenerator.generate({url: params.redirectUrl, user: params.user, redirectedUri: endApiRedirectUrl}, false);

        let spotifyRedirectUrl = SPOTIFY_AUTHORIZE_BASE_URL;
        spotifyRedirectUrl += ('?client_id=' + SPOTIFY_CLIENT_ID);
        spotifyRedirectUrl += ('&response_type=code');
        spotifyRedirectUrl += ('&redirect_uri=' + endApiRedirectUrl);
        spotifyRedirectUrl += ('&scope=user-read-private user-read-email');
        spotifyRedirectUrl += ('&state=' + state);
        return spotifyRedirectUrl;
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
        if (!state) {
            console.error('error state not found', code);
            return;
        }
        const stateData = await this.exchangeCodeGenerator.getData(state, false, true) as {url: string; user: UserProfile; redirectedUri: string};
        if (!stateData)
            throw new HttpErrors.UnprocessableEntity('State is invalid. Man in the middle?');
        if (error) {
            const codeParam = await this.exchangeCodeGenerator.generate({error: 'Failed to login to spotify', info: {error}}, true);
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
        console.log(code, state, error);
        try {
            const tokens = await axios.post(SPOTIFY_TOKEN_EXCHANGE_BASE_URL, qs.stringify({
                code: code,
                // eslint-disable-next-line @typescript-eslint/camelcase
                redirect_uri: stateData.redirectedUri,
                // eslint-disable-next-line @typescript-eslint/camelcase
                grant_type: 'authorization_code'
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: 'Basic ' + base64.encode(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET)
                }
            }) as {data: {access_token: string, scope: string, token_type: string, expires_in: number, refresh_token: string}};
            try {
                await this.userRepository.addService(user.id, {
                    token: tokens.data.access_token,
                    expiresIn: tokens.data.expires_in,
                    refreshToken: tokens.data.refresh_token
                })
            } catch (e) {
                const codeParam = await this.exchangeCodeGenerator.generate({error: 'Failed to store spotify token', info: e}, true);
                return this.response.redirect(stateData.url + '?code=' + codeParam);
            }
            const codeParam = await this.exchangeCodeGenerator.generate({status: 'Authenticated with spotify'}, true);
            return this.response.redirect(stateData.url + '?code=' + codeParam);
        } catch (e) {
            console.log(e);
            const codeParam = await this.exchangeCodeGenerator.generate({error: 'Failed to contact spotify api', info: {data: e.response.data, status: e.response.status, headers: e.response.headers}}, true);
            return this.response.redirect(stateData.url + '?code=' + codeParam);
        }
    }
}
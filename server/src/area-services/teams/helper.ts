import axios from "axios";
import * as qs from "querystring";
import {Context} from "@loopback/context";
import {User} from "../../models";
import {UserRepository} from "../../repositories";

const TEAMS_CLIENT_ID : string = process.env.TEAMS_CLIENT_ID ?? "";
const TEAMS_CLIENT_SECRET : string = process.env.TEAMS_CLIENT_SECRET ?? "";
const TEAMS_TENANT_ID : string = process.env.TEAMS_TENANT_ID ?? "";

const TEAMS_LOGIN_BASE_API = "https://login.microsoftonline.com";
const TEAMS_AUTHORIZE_URL = `${TEAMS_LOGIN_BASE_API}/${TEAMS_TENANT_ID}/oauth2/v2.0/authorize`;
const TEAMS_TOKEN_URL = `${TEAMS_LOGIN_BASE_API}/${TEAMS_TENANT_ID}/oauth2/v2.0/token`;

const TEAMS_SCOPES: string[] = [
    "https://graph.microsoft.com/.default"
];
const TEAMS_FORMATTED_SCOPE : string = TEAMS_SCOPES.join(' ');

const API_URL : string = process.env.API_URL ?? "http://localhost:8080";
const TEAMS_REDIRECT_URL = `${API_URL}/services/teams/oauth`;

export class TeamsException {
    constructor(error: string, info: object) {
        this.error = error;
        this.info = info;
    }
    error: string;
    info: object;
}

export interface TeamsTokens {
    token_type: string;
    scope: string;
    expires_in: number; //in seconds
    access_token: string;
    refresh_token: string;
    expires_at?: number; //in ms since epoch
}

export class TeamsHelper {

    public static generateLoginRedirectUrlWithoutState() : string {
        return `${TEAMS_AUTHORIZE_URL}?client_id=${TEAMS_CLIENT_ID}&response_type=code&redirect_uri=${encodeURI(TEAMS_REDIRECT_URL)}&response_mode=query&scope=${encodeURI(TEAMS_FORMATTED_SCOPE)}`;
    }

    public static async exchangeCodeForTokens(code : string) : Promise<TeamsTokens> {
        try {
            const tokens = await axios.post(TEAMS_TOKEN_URL, qs.stringify({
                // eslint-disable-next-line @typescript-eslint/camelcase
                client_id: TEAMS_CLIENT_ID,
                scope: encodeURI(TEAMS_FORMATTED_SCOPE),
                code: code,
                // eslint-disable-next-line @typescript-eslint/camelcase
                redirect_uri: encodeURI(TEAMS_REDIRECT_URL),
                // eslint-disable-next-line @typescript-eslint/camelcase
                grant_type: 'authorization_code',
                // eslint-disable-next-line @typescript-eslint/camelcase
                client_secret: TEAMS_CLIENT_SECRET
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            }) as {data: TeamsTokens};
            // eslint-disable-next-line @typescript-eslint/camelcase
            tokens.data.expires_at = new Date().valueOf() + tokens.data.expires_in * 1000;
            return tokens.data;
        } catch (e) {
            throw new TeamsException('Failed to contact teams api', {data: e.response.data, status: e.response.status, headers: e.response.headers});
        }
    }

    public static async refreshTokensForUser(user : User, ctx : Context) {
        const services: {teams?: TeamsTokens} | undefined = user.services;
        if (!services) {
            throw new TeamsException('Failed to retrieve user services', {});
        }
        if (!services.teams) {
            throw new TeamsException('User is not connected to teams', {});
        }
        if (new Date().valueOf() < services.teams.expires_at!)
            return;
        try {
            const tokens = await axios.post(TEAMS_TOKEN_URL, qs.stringify({
                // eslint-disable-next-line @typescript-eslint/camelcase
                client_id: TEAMS_CLIENT_ID,
                // eslint-disable-next-line @typescript-eslint/camelcase
                grant_type: 'refresh_token',
                scope: encodeURI(TEAMS_FORMATTED_SCOPE),
                // eslint-disable-next-line @typescript-eslint/camelcase
                refresh_token: services.teams.refresh_token,
                // eslint-disable-next-line @typescript-eslint/camelcase
                redirect_uri: encodeURI(TEAMS_REDIRECT_URL),
                // eslint-disable-next-line @typescript-eslint/camelcase
                client_secret: TEAMS_CLIENT_SECRET
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            }) as {data: TeamsTokens};
            // eslint-disable-next-line @typescript-eslint/camelcase
            tokens.data.expires_at = new Date().valueOf() + tokens.data.expires_in * 1000;
            services.teams = tokens.data;
        } catch (e) {
            throw new TeamsException('Failed to contact teams api', {data: e.response.data, status: e.response.status, headers: e.response.headers});
        }
        user.services = services;
        try {
            const userRepository: UserRepository = await ctx.get('repositories.UserRepository');
            await userRepository.update(user);
        } catch (e) {
            throw new TeamsException('Failed to update user in database', e);
        }
    }

    public static getClientId() : string {
        return TEAMS_CLIENT_ID;
    }

    public static getClientSecret() : string {
        return TEAMS_CLIENT_SECRET;
    }

    public static getTenantId() : string {
        return TEAMS_TENANT_ID;
    }
}
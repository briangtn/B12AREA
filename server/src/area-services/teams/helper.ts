import axios from "axios";
import * as qs from "querystring";
import {Context} from "@loopback/context";
import {User} from "../../models";
import {ActionRepository, UserRepository} from "../../repositories";
import {AreaService} from "../../services";
import {ActionFunction} from "../../services-interfaces";
import {TeamsAPIChatMessageResource} from "./teamsApiResources";

const TEAMS_CLIENT_ID : string = process.env.TEAMS_CLIENT_ID ?? "";
const TEAMS_CLIENT_SECRET : string = process.env.TEAMS_CLIENT_SECRET ?? "";
const TEAMS_TENANT_ID : string = process.env.TEAMS_TENANT_ID ?? "";

const TEAMS_LOGIN_BASE_API = "https://login.microsoftonline.com";
const TEAMS_AUTHORIZE_URL = `${TEAMS_LOGIN_BASE_API}/${TEAMS_TENANT_ID}/oauth2/v2.0/authorize`;
const TEAMS_TOKEN_URL = `${TEAMS_LOGIN_BASE_API}/${TEAMS_TENANT_ID}/oauth2/v2.0/token`;

const TEAMS_SCOPES: string[] = [
    "https://graph.microsoft.com/.default",
    "offline_access"
];
const TEAMS_FORMATTED_SCOPE : string = TEAMS_SCOPES.join(' ');

const API_URL : string = process.env.API_URL ?? "http://localhost:8080";
const TEAMS_REDIRECT_URL = `${API_URL}/services/teams/oauth`;

const TEAMS_NEW_MESSAGE_IN_CHANNEL_PULLING_PREFIX = 'teams_newMessageInChannel_';
const TEAMS_NEW_MESSAGE_IN_CHANNEL_PULLING_DELTA = 30; //in seconds

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

export interface TeamsNewMessageInChannelOptions {
    teamId: string;
    channelId: string;
    mustMatch?: string;
}

export interface TeamsNewMessageInChannelData {
    lastPulled: string;
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
        const teamsKey = "teams" as keyof typeof user.services;
        if (!services || !user.services) {
            throw new TeamsException('Failed to retrieve user services', {});
        }
        if (!services.teams) {
            throw new TeamsException('User is not connected to teams', {});
        }
        if (new Date().valueOf() + 5 * 60 * 1000 < services.teams.expires_at!)
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
            try {
                delete user.services[teamsKey];
                const userRepository: UserRepository = await ctx.get('repositories.UserRepository');
                await userRepository.update(user);
            } catch (e2) {
                throw new TeamsException('Failed to contact teams api and Failed to update user in database', e2);
            }
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

    public static async getNewMessageInChannelPullingUrl(actionId?: string, ctx?: Context): Promise<string|undefined> {
        if (!actionId || !ctx)
            return;
        const actionRepository: ActionRepository = await ctx.get('repositories.ActionRepository');
        const actionOptions: TeamsNewMessageInChannelOptions = (await actionRepository.getActionSettings(actionId))! as TeamsNewMessageInChannelOptions;
        const actionData: TeamsNewMessageInChannelData = (await actionRepository.getActionData(actionId))! as TeamsNewMessageInChannelData;
        const lastPulledDate = new Date(actionData.lastPulled).toISOString();
        return `https://graph.microsoft.com/beta/teams/${actionOptions.teamId}/channels/${actionOptions.channelId}/messages/delta?filter=lastModifiedDateTime gt ${lastPulledDate}`
    }

    public static async startNewMessageInChannelPulling(actionID: string, userID: string, ctx: Context) {
        const areaService: AreaService = await ctx.get('services.area');
        const userRepository: UserRepository = await ctx.get('repositories.UserRepository');
        const actionRepository: ActionRepository = await ctx.get('repositories.ActionRepository');

        const user: User = await userRepository.findById(userID);

        await this.refreshTokensForUser(user, ctx);

        const tokens: TeamsTokens = await userRepository.getServiceInformation(userID, 'teams') as TeamsTokens;
        const actionOptions: TeamsNewMessageInChannelOptions = (await actionRepository.getActionSettings(actionID))! as TeamsNewMessageInChannelOptions;
        const actionData: TeamsNewMessageInChannelData = (await actionRepository.getActionData(actionID))! as TeamsNewMessageInChannelData;

        if (!tokens || !tokens.access_token)
            return;
        areaService.startPulling(
            this.getNewMessageInChannelPullingUrl,
            {headers: {Authorization: 'Bearer ' + tokens.access_token}},
            async (data: {value: TeamsAPIChatMessageResource[]}) => {
                const diff = [];

                for (const chatMessage of data.value) {
                    if (new Date(chatMessage.createdDateTime) >= new Date(actionData.lastPulled)) {
                        if (actionOptions.mustMatch) {
                            if (new RegExp(actionOptions.mustMatch).test(chatMessage.body.content)) {
                                diff.push(chatMessage);
                            }
                        } else {
                            diff.push(chatMessage);
                        }
                    }
                }
                await actionRepository.setActionData(actionID, {lastPulled: new Date().toISOString()});
                return diff;
            }, async (data: TeamsAPIChatMessageResource[]) => {
                for (const chatMessage of data) {
                    let placeholders: Array<{name: string, value: string}> = [
                        {
                            name: "Author",
                            value: chatMessage.from.user?.displayName!
                        },
                        {
                            name: "Message",
                            value: chatMessage.body.content
                        },
                        {
                            name: "MessageId",
                            value: chatMessage.id
                        }
                    ];
                    placeholders = placeholders.concat(areaService.createWordsPlaceholders(chatMessage.body.content));
                    if (actionOptions.mustMatch) {
                        placeholders = placeholders.concat(areaService.createRegexPlaceholders(chatMessage.body.content, actionOptions.mustMatch, 'Matches'));
                    }
                    await ActionFunction({
                        actionId: actionID,
                        placeholders: placeholders
                    }, ctx)
                }
            }, TEAMS_NEW_MESSAGE_IN_CHANNEL_PULLING_DELTA, TEAMS_NEW_MESSAGE_IN_CHANNEL_PULLING_PREFIX + actionID, actionID, ctx);
    }

    public static async stopNewMessageInChannelPulling(actionID: string, ctx: Context) {
        const areaService: AreaService = await ctx.get('services.area');

        areaService.stopPulling(TEAMS_NEW_MESSAGE_IN_CHANNEL_PULLING_PREFIX + actionID);
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
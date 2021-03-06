import axios from "axios";
import * as qs from "querystring";
import {Context} from "@loopback/context";
import {User} from "../../models";
import {ActionRepository, UserRepository} from "../../repositories";
import {
    OutlookEmailResource,
    OutlookSendEmailRequestResource,
    OutlookSubscriptionResource
} from "./outlookApiResources";
import {ActionFunction} from "../../services-interfaces";
import {AreaService} from "../../services";
import WorkerHelper from "../../WorkerHelper";

const OUTLOOK_CLIENT_ID : string = process.env.OUTLOOK_CLIENT_ID ?? "";
const OUTLOOK_CLIENT_SECRET : string = process.env.OUTLOOK_CLIENT_SECRET ?? "";

const OUTLOOK_LOGIN_BASE_API = "https://login.microsoftonline.com";
const OUTLOOK_AUTHORIZE_URL = `${OUTLOOK_LOGIN_BASE_API}/common/oauth2/v2.0/authorize`;
const OUTLOOK_TOKEN_URL = `${OUTLOOK_LOGIN_BASE_API}/common/oauth2/v2.0/token`;

const OUTLOOK_SCOPES: string[] = [
    "https://graph.microsoft.com/.default",
    "offline_access"
];
const OUTLOOK_FORMATTED_SCOPE : string = OUTLOOK_SCOPES.join(' ');

const API_URL : string = process.env.API_URL ?? "http://localhost:8080";
const OUTLOOK_REDIRECT_URL = `${API_URL}/services/outlook/oauth`;

const OUTLOOK_MESSAGE_SUBSCRIPTION_MAX_EXPIRATION = 4230; //in minutes
export const OUTLOOK_DELAYED_JOB_REFRESH_SUBSCRIPTION = 'outlook_refreshSubscription_';

export class OutlookException {
    constructor(error: string, info: object = {}) {
        this.error = error;
        this.info = info;
    }
    error: string;
    info: object;
}

export interface OutlookTokens {
    token_type: string;
    scope: string;
    expires_in: number; //in seconds
    access_token: string;
    refresh_token: string;
    expires_at?: number; //in ms since epoch
}

export interface OutlookNewEmailOptions {
    onlySender?: string;
    onlyObjectMatch?: string;
    onlyBodyMatch?: string;
}

export interface ServiceSendEmailData {
    sendTo: string,
    sendCc?: string,
    sendBcc?: string,
    sendSubject: string,
    sendBody: string,
    sendBodyType?: string,
    sendSaveToSentItem?: boolean
}

export class OutlookHelper {

    public static generateLoginRedirectUrlWithoutState() : string {
        return `${OUTLOOK_AUTHORIZE_URL}?client_id=${OUTLOOK_CLIENT_ID}&response_type=code&redirect_uri=${encodeURI(OUTLOOK_REDIRECT_URL)}&response_mode=query&scope=${encodeURI(OUTLOOK_FORMATTED_SCOPE)}`;
    }

    public static async exchangeCodeForTokens(code : string) : Promise<OutlookTokens> {
        try {
            const tokens = await axios.post(OUTLOOK_TOKEN_URL, qs.stringify({
                // eslint-disable-next-line @typescript-eslint/camelcase
                client_id: OUTLOOK_CLIENT_ID,
                scope: encodeURI(OUTLOOK_FORMATTED_SCOPE),
                code: code,
                // eslint-disable-next-line @typescript-eslint/camelcase
                redirect_uri: encodeURI(OUTLOOK_REDIRECT_URL),
                // eslint-disable-next-line @typescript-eslint/camelcase
                grant_type: 'authorization_code',
                // eslint-disable-next-line @typescript-eslint/camelcase
                client_secret: OUTLOOK_CLIENT_SECRET
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            }) as {data: OutlookTokens};
            // eslint-disable-next-line @typescript-eslint/camelcase
            tokens.data.expires_at = new Date().valueOf() + tokens.data.expires_in * 1000;
            return tokens.data;
        } catch (e) {
            throw new OutlookException('Failed to contact outlook api', {data: e.response.data, status: e.response.status, headers: e.response.headers});
        }
    }

    public static async refreshTokensForUser(user : User, ctx : Context) {
        const services: {outlook?: OutlookTokens} | undefined = user.services;
        const outlookKey = "outlook" as keyof typeof user.services;
        if (!services || !user.services) {
            throw new OutlookException('Failed to retrieve user services', {});
        }
        if (!services.outlook) {
            throw new OutlookException('User is not connected to outlook', {});
        }
        if (new Date().valueOf() + 5 * 60 * 1000 < services.outlook.expires_at!)
            return;
        try {
            const tokens = await axios.post(OUTLOOK_TOKEN_URL, qs.stringify({
                // eslint-disable-next-line @typescript-eslint/camelcase
                client_id: OUTLOOK_CLIENT_ID,
                // eslint-disable-next-line @typescript-eslint/camelcase
                grant_type: 'refresh_token',
                scope: encodeURI(OUTLOOK_FORMATTED_SCOPE),
                // eslint-disable-next-line @typescript-eslint/camelcase
                refresh_token: services.outlook.refresh_token,
                // eslint-disable-next-line @typescript-eslint/camelcase
                redirect_uri: encodeURI(OUTLOOK_REDIRECT_URL),
                // eslint-disable-next-line @typescript-eslint/camelcase
                client_secret: OUTLOOK_CLIENT_SECRET
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            }) as {data: OutlookTokens};
            // eslint-disable-next-line @typescript-eslint/camelcase
            tokens.data.expires_at = new Date().valueOf() + tokens.data.expires_in * 1000;
            services.outlook = tokens.data;
        } catch (e) {
            try {
                delete user.services[outlookKey];
                const userRepository: UserRepository = await ctx.get('repositories.UserRepository');
                await userRepository.update(user);
            } catch (e2) {
                throw new OutlookException('Failed to contact outlook api and Failed to update user in database', e2);
            }
            throw new OutlookException('Failed to contact outlook api', {data: e.response.data, status: e.response.status, headers: e.response.headers});
        }
        user.services = services;
        try {
            const userRepository: UserRepository = await ctx.get('repositories.UserRepository');
            await userRepository.update(user);
        } catch (e) {
            throw new OutlookException('Failed to update user in database', e);
        }
    }

    public static async getTokensForUserId(userId : string, ctx : Context): Promise<OutlookTokens> {
        let userRepository: UserRepository | undefined = undefined;
        try {
            userRepository = await ctx.get('repositories.UserRepository');
        } catch (e) {
            throw new OutlookException('Could not resolve repositories in given context', e);
        }
        if (!userRepository)
            throw new OutlookException('Could not resolve repositories in given context');
        await this.refreshTokensForUser(await userRepository.findById(userId), ctx);
        try {
            return await userRepository.getServiceInformation(userId, 'outlook') as OutlookTokens;
        } catch (e) {
            throw new OutlookException('User is not connected to outlook');
        }
    }

    public static startSubscriptionRefreshDelayedJob(actionId: string, ownerId: string, subscription: OutlookSubscriptionResource, ctx: Context) {
        const expirationDate = new Date(subscription.expirationDateTime);
        const now = new Date();
        const jobName = OUTLOOK_DELAYED_JOB_REFRESH_SUBSCRIPTION + subscription.id;
        if (now >= expirationDate) {
            WorkerHelper.AddDelayedJob({
                service: 'outlook',
                name: jobName,
                triggerIn: 1000,
                jobData: {subscription, ownerId, actionId}
            }, ctx).catch((e) => {console.error(`Failed to add delayed job ${jobName}:`, e)});
        } else {
            WorkerHelper.AddDelayedJob({
                service: 'outlook',
                name: jobName,
                triggerIn: new Date(expirationDate.getTime() - 12 * 60 * 60 * 1000).getTime(),
                jobData: {subscription, ownerId, actionId}
            }, ctx).catch((e) => {console.error(`Failed to add delayed job ${jobName}:`, e)});
        }
    }

    public static stopSubscriptionRefreshDelayedJob(subscription: OutlookSubscriptionResource, ctx: Context) {
        const jobName = OUTLOOK_DELAYED_JOB_REFRESH_SUBSCRIPTION + subscription.id;
        WorkerHelper.RemoveDelayedJob('outlook', jobName, ctx)
            .catch((e) => {console.error(`Failed to remove delayed job ${jobName}`, e)});
    }

    public static async registerNewMessageReceivedSubscription(notificationUrl: string, outlookTokens: OutlookTokens, state = "ignored", specificInbox?: string): Promise<OutlookSubscriptionResource> {
        const REGISTER_NEW_SUBSCRIPTION_URL = 'https://graph.microsoft.com/v1.0/subscriptions';
        const RESSOURCE_VALUE = specificInbox ? `me/mailfolders('${specificInbox}')/messages` : 'me/messages';
        try {
            const now = new Date().getTime();
            const expirationDateTime = new Date(now + OUTLOOK_MESSAGE_SUBSCRIPTION_MAX_EXPIRATION * 60 * 1000);
            const response: {data: OutlookSubscriptionResource} = await axios.post(REGISTER_NEW_SUBSCRIPTION_URL, {
                changeType: 'created',
                notificationUrl: notificationUrl,
                resource: RESSOURCE_VALUE,
                expirationDateTime: expirationDateTime.toISOString(),
                clientState: state,
                latestSupportedTlsVersion: "v1_2"
            }, {
                headers: {
                    'Content-type': 'application/json',
                    'Authorization': `${outlookTokens.token_type} ${outlookTokens.access_token}`
                }
            }) as {data: OutlookSubscriptionResource};
            return {
                changeType: response.data.changeType,
                notificationUrl: response.data.notificationUrl,
                resource: response.data.resource,
                expirationDateTime: response.data.expirationDateTime,
                clientState: response.data.clientState,
                id: response.data.id,
                applicationId: response.data.applicationId,
                creatorId: response.data.creatorId,
                latestSupportedTlsVersion: response.data.latestSupportedTlsVersion,
            };
        } catch (e) {
            throw new OutlookException('Failed to register new subscription', {data: e.response.data, status: e.response.status, headers: e.response.headers});
        }
    }

    public static async refreshMessageReceivedSubscription(subscription: OutlookSubscriptionResource, outlookTokens: OutlookTokens): Promise<OutlookSubscriptionResource> {
        const UPDATE_SUBSCRIPTION_URL = `https://graph.microsoft.com/v1.0/subscriptions/${subscription.id}`;
        const now = new Date();

        if (now >= new Date(subscription.expirationDateTime)) {
            const re = new RegExp("me\\/mailfolders\\('([^']+)'\\)\\/messages");
            let specificInbox: string|undefined = undefined;
            if (re.test(subscription.resource))
                specificInbox = re.exec(subscription.resource)![1];
            return this.registerNewMessageReceivedSubscription(subscription.notificationUrl, outlookTokens, subscription.clientState!, specificInbox);
        }

        try {
            const expirationDateTime = new Date(now.getTime() + OUTLOOK_MESSAGE_SUBSCRIPTION_MAX_EXPIRATION * 60 * 1000).toISOString();
            const response: {data: OutlookSubscriptionResource} = await axios.patch(UPDATE_SUBSCRIPTION_URL, {
                expirationDateTime: expirationDateTime
            }, {
                headers: {
                    'Content-type': 'application/json',
                    'Authorization': `${outlookTokens.token_type} ${outlookTokens.access_token}`
                }
            }) as {data: OutlookSubscriptionResource};
            return {
                changeType: response.data.changeType,
                notificationUrl: response.data.notificationUrl,
                resource: response.data.resource,
                expirationDateTime: response.data.expirationDateTime,
                clientState: response.data.clientState,
                id: response.data.id,
                applicationId: response.data.applicationId,
                creatorId: response.data.creatorId,
                latestSupportedTlsVersion: response.data.latestSupportedTlsVersion,
            };
        } catch (e) {
            throw new OutlookException('Failed to update subscription', {data: e.response.data, status: e.response.status, headers: e.response.headers});
        }
    }

    public static async deleteSubscription(subscription: OutlookSubscriptionResource, outlookTokens: OutlookTokens): Promise<void> {
        const DELETE_SUBSCRIPTION_URL = `https://graph.microsoft.com/v1.0/subscriptions/${subscription.id}`;
        try {
            await axios.delete(DELETE_SUBSCRIPTION_URL, {
                headers: {
                    'Authorization': `${outlookTokens.token_type} ${outlookTokens.access_token}`
                }
            });
        } catch (e) {
            throw new OutlookException('Failed to delete subscription', {data: e.response.data, status: e.response.status, headers: e.response.headers});
        }
    }

    public static async processSubscription(actionId: string, subscription: OutlookSubscriptionResource, resource: string, ctx: Context) {
        let actionRepository: ActionRepository | undefined = undefined;
        let areaService: AreaService | undefined = undefined;
        try {
            actionRepository = await ctx.get('repositories.ActionRepository');
            areaService = await ctx.get('services.area');
        } catch (e) {
            throw new OutlookException('Could not resolve repositories in given context', e);
        }
        if (!actionRepository || !areaService)
            throw new OutlookException('Could not resolve repositories in given context');
        const userId: string|null = await actionRepository.getActionOwnerID(actionId);
        if (!userId)
            throw new OutlookException(`Could not resolve user for action ${actionId}`);
        const options: OutlookNewEmailOptions|null = await actionRepository.getActionSettings(actionId);
        if (!options)
            throw new OutlookException(`Missing options to action ${actionId}`);
        let placeholders: Array<{name: string, value: string}> = [];
        try {
            const outlookTokens: OutlookTokens = await this.getTokensForUserId(userId, ctx);
            const result: {data: OutlookEmailResource} = await axios.get(`https://graph.microsoft.com/v1.0/${resource}`, {
                headers: {
                    Authorization: `${outlookTokens.token_type} ${outlookTokens.access_token}`
                }
            }) as {data: OutlookEmailResource};
            const email: OutlookEmailResource = result.data;
            if (options.onlySender && email.sender.emailAddress.address !== options.onlySender) {
                return;
            }
            if (options.onlyObjectMatch) {
                const re = new RegExp(options.onlyObjectMatch, 'gs');
                if (!re.test(email.subject)) {
                    return;
                }
                placeholders = placeholders.concat(areaService.createRegexPlaceholders(email.subject, options.onlyObjectMatch, 'ObjectMatches'));
            }
            if (options.onlyBodyMatch) {
                const re = new RegExp(options.onlyBodyMatch, 'gs');
                if (!re.test(email.body.content)) {
                    return;
                }
                placeholders = placeholders.concat(areaService.createRegexPlaceholders(email.body.content, options.onlyBodyMatch, 'BodyMatches'));
            }
            placeholders = placeholders.concat([
                {
                    name: "EmailBody",
                    value: email.body.content
                },
                {
                    name: "EmailSender",
                    value: email.sender.emailAddress.address
                },
                {
                    name: "EmailObject",
                    value: email.subject
                }
            ]);
            placeholders = placeholders.concat(areaService.createWordsPlaceholders(email.body.content));
        } catch (e) {
            throw new OutlookException('Failed to contact outlook api', {data: e.response.data, status: e.response.status, headers: e.response.headers});
        }
        await ActionFunction({
            actionId: actionId,
            placeholders: placeholders
        }, ctx);
    }

    public static async sendEmail(sendEmailData: ServiceSendEmailData, tokens: OutlookTokens) {
        const parsedEmail = this.outlookSendEmailDataToOutlookData(sendEmailData);
        try {
            await axios.post(`https://graph.microsoft.com/v1.0/me/sendMail`, parsedEmail, {
                headers: {
                    Authorization: `${tokens.token_type} ${tokens.access_token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (e) {
            throw new OutlookException('Failed to send email: ', {data: e.response.data, status: e.response.status, headers: e.response.headers});
        }
    }

    public static outlookSendEmailDataToOutlookData(sendEmailData: ServiceSendEmailData): OutlookSendEmailRequestResource {
        if (sendEmailData.sendBodyType === undefined)
            sendEmailData.sendBodyType = 'text';
        if (sendEmailData.sendSaveToSentItem === undefined)
            sendEmailData.sendSaveToSentItem = true;
        const toRecipients = sendEmailData.sendTo.split(',').map((recipient) => {
            return {emailAddress: {address: recipient}}
        });
        let ccRecipients: {emailAddress: {address: string}}[] = [];
        if (sendEmailData.sendCc) {
            ccRecipients = sendEmailData.sendCc.split(',').map((recipient) => {
                return {emailAddress: {address: recipient}}
            });
        }
        let bccRecipients: {emailAddress: {address: string}}[] = [];
        if (sendEmailData.sendBcc) {
            bccRecipients = sendEmailData.sendBcc.split(',').map((recipient) => {
                return {emailAddress: {address: recipient}}
            });
        }
        return {
            message: {
                subject: sendEmailData.sendSubject,
                body: {
                    contentType: sendEmailData.sendBodyType,
                    content: sendEmailData.sendBody
                },
                toRecipients: toRecipients,
                ccRecipients: ccRecipients,
                bccRecipients: bccRecipients,
            },
            saveToSentItems: sendEmailData.sendSaveToSentItem
        }
    }

    public static getClientId() : string {
        return OUTLOOK_CLIENT_ID;
    }

    public static getClientSecret() : string {
        return OUTLOOK_CLIENT_SECRET;
    }
}
import {NewVideoData, TokensResponse} from "./interfaces";
import axios from "axios";
import {ActionRepository, UserRepository} from "../../repositories";
import {Context} from "@loopback/context";
import ServiceController from "./controller";
import {google} from "googleapis";
import * as qs from "querystring";
import {RandomGeneratorManager} from "../../services";
import {Action} from "../../models";
import {OperationStatus} from "../../services-interfaces";
import DomParser from "dom-parser";

const API_URL : string = process.env.API_URL ?? "http://localhost:8080";

export enum PubSubMode {
    SUBSCRIBE = "subscribe",
    UNSUBSCRIBE = "unsubscribe"
}

export class YoutubeHelper {
    public static WEBHOOK_PREFIX = `${API_URL}/services/youtube/actions/new_video/webhook/`;
    public static YOUTUBE_WATCH_URL = "https://www.youtube.com/xml/feeds/videos.xml?channel_id=";
    public static SUBSCRIBE_URL = 'https://pubsubhubbub.appspot.com/subscribe';
    private static SUB_INFOS_URL = 'https://pubsubhubbub.appspot.com/subscription-details';

    public static GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    public static GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    public static YOUTUBE_API_KEY : string = process.env.YOUTUBE_API_KEY ?? "";

    public static getAuthUrl(redirectUrl: string) {
        const oauth2Client = new google.auth.OAuth2(
            this.GOOGLE_CLIENT_ID,
            this.GOOGLE_CLIENT_SECRET,
            redirectUrl
        );

        const scopes = [
            'https://www.googleapis.com/auth/youtube'
        ];

        return oauth2Client.generateAuthUrl({
            // 'online' (default) or 'offline' (gets refresh_token)
            // eslint-disable-next-line @typescript-eslint/camelcase
            access_type: 'offline',

            // If you only need one scope you can pass it as a string
            scope: scopes
        });
    }

    public static async getToken(code: string, redirectUri: string) {
        const oauth2Client = new google.auth.OAuth2(
            this.GOOGLE_CLIENT_ID,
            this.GOOGLE_CLIENT_SECRET,
            redirectUri
        );
        return (await oauth2Client.getToken(code)).tokens
    }

    public static getAuthClient() {
        return new google.auth.OAuth2(
            YoutubeHelper.GOOGLE_CLIENT_ID,
            YoutubeHelper.GOOGLE_CLIENT_SECRET,
            YoutubeHelper.YOUTUBE_API_KEY
        );
    }

    public static async updateToken(userId: string, token: TokensResponse, ctx: Context) : Promise<void> {
        const userRepository: UserRepository = await ctx.get('repositories.UserRepository');

        await userRepository.addService(userId, {
            ...token,
        }, ServiceController.serviceName);
    }

    public static updateWebhookAPIURL(action: Action, channelId: string, ctx: Context) {
        YoutubeHelper.deleteWebhook(action.id!, channelId, ctx).then(() => {
            YoutubeHelper.createWebhook(action.serviceAction.split('.')[2], channelId, ctx).then(async (webhookUrl) => {
                const actionRepository: ActionRepository = await ctx.get('repositories.ActionRepository');
                const data : NewVideoData = {
                    webHookUrl: webhookUrl
                };
                action.data = data;
                await actionRepository.save(action);
            }).catch((err) => {
                console.error(`Failed to recreate webhook`, err);
            });
        }).catch((err) => {
            console.error(`Failed to delete webhook`, err);
        });
    }

    public static async postSubscribeWebhook(webhookUrl: string, channelId: string): Promise<string> {
        const topicUrl = this.getTopicUrl(channelId);

        return new Promise<string>((resolve, reject) => {
            axios.post(this.SUBSCRIBE_URL, this.getPushSubHubData(webhookUrl, channelId, PubSubMode.SUBSCRIBE), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).then(() => {
                console.debug("[YOUTUBE SERVICE] WebHook subscription details", this.getInfosUrl(channelId, webhookUrl));
                this.prepareRefreshWebhook(channelId, webhookUrl);
                resolve(webhookUrl);
            }).catch(() => {
                reject(`Could not setup webhook for ${topicUrl}`)
            });
        });
    }

    public static async createWebhook(actionName: string, channelId: string, ctx: Context) : Promise<string> {
        let generated = false;
        let webhookUrl = "";
        const randomGeneratorService: RandomGeneratorManager = await ctx.get('services.randomGenerator');
        const actionRepository : ActionRepository = await ctx.get('repositories.ActionRepository');

        while (!generated) {
            const generatedUUID = randomGeneratorService.generateRandomString(16);
            webhookUrl = `${this.WEBHOOK_PREFIX}${generatedUUID}`;
            try {
                const count = await actionRepository.count({
                    and: [
                        {
                            serviceAction: `youtube.A.${actionName}`
                        },
                        {
                            "data.webHookUrl": webhookUrl
                        }
                    ]
                });
                if (count.count === 0)
                    generated = true;
            } catch (e) {
                generated = false;
            }
        }

        const res = await this.postSubscribeWebhook(webhookUrl, channelId);
        this.prepareRefreshWebhook(channelId, webhookUrl);
        return res;
    }

    public static async deleteWebhook(actionId: string, channelId: string, ctx: Context): Promise<OperationStatus> {
        const actionRepository : ActionRepository = await ctx.get('repositories.ActionRepository');
        const action : Action = await actionRepository.findById(actionId);

        if (!action || !action.data)
            return { success: false, error: "Failed to retrieve action" };
        const data = action.data as NewVideoData;

        return new Promise((resolve, reject) => {
            axios.post(this.SUBSCRIBE_URL, this.getPushSubHubData(data.webHookUrl, channelId, PubSubMode.UNSUBSCRIBE), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).then(() => {
                resolve({ success: true });
            }).catch((err) => {
                reject({ success: false, details: err});
            })
        });
    }

    static prepareRefreshWebhook(channelId: string, webhook: string) {
        axios.get(YoutubeHelper.getInfosUrl(channelId, webhook)).then((res) => {
            const data = new DomParser().parseFromString(res.data).getElementsByTagName('dd');
            let dates: Date[] = [];

            for (const node of data!) {
                const date = new Date(node.textContent);
                if (!isNaN(date.getUTCMilliseconds())) {
                    dates.push(date);
                }
            }
            dates = dates.sort();
            const delayToRefresh = dates[dates.length - 1].getTime() - new Date(Date.now()).getTime() - (1000 * 60 * 60);
            setTimeout(() => {
                this.postSubscribeWebhook(webhook, channelId).then(() => {}).catch(console.error);
            }, delayToRefresh);
        }).catch((err) => {
            console.error(err);
        })
    }

    static getPushSubHubData(webHookUrl: string, channelId: string, mode: PubSubMode): string {
        return qs.stringify({
            "hub.callback": webHookUrl,
            "hub.topic": this.YOUTUBE_WATCH_URL + channelId,
            "hub.verify": 'async',
            "hub.mode": mode,
            "hub.verify_token": "",
            "hub.secret": "",
            "hub.lease_seconds": ""
        })
    }

    static getTopicUrl(channelId: string) {
        return this.YOUTUBE_WATCH_URL + channelId;
    }

    static getInfosUrl(channelId: string, webhookUrl: string) {
        return `${YoutubeHelper.SUB_INFOS_URL}?hub.callback=${webhookUrl}&hub.topic=${YoutubeHelper.getTopicUrl(channelId)}&hub.secret=`
    }
}
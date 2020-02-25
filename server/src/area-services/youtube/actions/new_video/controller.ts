import {get, param, post, requestBody} from "@loopback/rest";
import {ActionConfig, ActionFunction, OperationStatus} from '../../../../services-interfaces'
import config from './config.json';
import {Context, inject} from "@loopback/context";
import {
    ActionRepository,
    UserRepository
} from "../../../../repositories";
import {repository} from "@loopback/repository";
import {RandomGeneratorManager} from "../../../../services";
import axios from "axios";
import * as qs from 'querystring'
import {Action} from "../../../../models";


const API_URL : string = process.env.API_URL ?? "http://localhost:8080";
const YOUTUBE_WATCH_URL = "https://www.youtube.com/xml/feeds/videos.xml?channel_id=";
const WEBHOOK_PREFIX = `${API_URL}/services/youtube/actions/${config.displayName}/webhook/`;
const SUBSCRIBE_URL = 'https://pubsubhubbub.appspot.com/subscribe';
const SUB_INFOS_URL = 'https://pubsubhubbub.appspot.com/subscription-details';

interface NewVideoConfig {
    channel: string
}

interface NewVideoData {
    webHookUrl: string
}

export default class ActionController {

    constructor(
        @inject.context() private ctx: Context,
        @repository(UserRepository) public userRepository: UserRepository,
        @repository(ActionRepository) public actionRepository: ActionRepository,
    ) {
    }

    @get('/webhook/{webhookId}')
    async validation(
        @param.path.string('webhookId') webhookId: string,
        @param.query.string('hub.challenge') challenge: string,
    ) {
        if (!challenge)
            return "No challenge provided";
        return challenge;
    }

    @post('/webhook/{webhookId}')
    async webhook(
        @param.path.string('webhookId') webhookId: string,
        @requestBody({
            content: {
                'application/atom+xml': {}
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) body : any
    ) {
        const action = await this.actionRepository.findOne({
            where: {
                and: [
                    {
                        serviceAction: `youtube.A.${config.displayName}`
                    },
                    {
                        "data.webHookUrl": `${WEBHOOK_PREFIX}${webhookId}`
                    }
                ]
            }
        });
        if (!action)
            return { error: `Failed to process event: webhook ${webhookId} : webhook not found in database` };
        const video = body.feed.entry[0];
        return ActionFunction({
            actionId: action.id!,
            placeholders: [
                {
                    name: "videoID",
                    value: video['yt:videoid'][0]
                },
                {
                    name: "channelId",
                    value: video['yt:channelid'][0]
                },
                {
                    name: "title",
                    value: video.title[0]
                },
                {
                    name: "link",
                    value: video.link[0]['$'].href
                },
                {
                    name: "authorName",
                    value: video.author[0].name[0]
                },
                {
                    name: "authorLink",
                    value: video.author[0].uri[0]
                },
                {
                    name: "published",
                    value: video.published[0]
                },
                {
                    name: "updated",
                    value: video.updated[0]
                }
            ]
        }, this.ctx);
    }

    static async createAction(userId: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        const newVideoConfig: NewVideoConfig = actionConfig as NewVideoConfig;

        let randomGeneratorService: RandomGeneratorManager | undefined = undefined;
        let actionRepository : ActionRepository | undefined = undefined;
        try {
            actionRepository = await ctx.get('repositories.ActionRepository');
            randomGeneratorService = await ctx.get('services.randomGenerator');
        } catch (e) {
            return { success: false, error: "Could not resolve service or repository in given context", details: e };
        }
        if (!randomGeneratorService || !actionRepository)
            return { success: false, error: "Could not resolve RandomGeneratorService in given context"};

        let generated = false;
        let webhookUrl = "";
        while (!generated) {
            const generatedUUID = randomGeneratorService.generateRandomString(16);
            webhookUrl = `${WEBHOOK_PREFIX}${generatedUUID}`;
            try {
                const count = await actionRepository.count({
                    and: [
                        {
                            serviceAction: `youtube.A.${config.displayName}`
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

        const topicUrl = YOUTUBE_WATCH_URL + newVideoConfig.channel;

        try {
            await axios.post(SUBSCRIBE_URL, qs.stringify({
                "hub.callback": webhookUrl,
                "hub.topic": topicUrl,
                "hub.verify": 'async',
                "hub.mode": 'subscribe',
                // eslint-disable-next-line @typescript-eslint/camelcase
                "hub.verify_token": "",
                "hub.secret": "",
                // eslint-disable-next-line @typescript-eslint/camelcase
                "hub.lease_seconds": ""
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            console.log("WebHook informations", `${SUB_INFOS_URL}?hub.callback=${webhookUrl}&hub.topic=${topicUrl}&hub.secret=`)
        } catch (e) {
            return { success: false, options: actionConfig, details: e}
        }
        const data : NewVideoData = {
            webHookUrl: webhookUrl
        };
        return { success: true, options: actionConfig, data: data}
    }

    static async updateAction(actionId: string, oldActionConfig: Object, newActionConfig: Object, ctx: Context): Promise<OperationStatus> {
        //TODO
        return { success: true, options: newActionConfig}
    }

    static async deleteAction(actionId: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        const newVideoConfig: NewVideoConfig = actionConfig as NewVideoConfig;

        let actionRepository : ActionRepository | undefined = undefined;
        try {
            actionRepository = await ctx.get('repositories.ActionRepository');
        } catch (e) {
            return { success: false, error: "Could not resolve repositories in given context", details: e };
        }
        if (!actionRepository)
            return { success: false, error: "Could not resolve repositories in given context" };

        let action : Action | undefined = undefined;
        try {
            action = await actionRepository.findById(actionId);
        } catch (e) {
            return { success: false, error: "Failed to retrieve action", details: e};
        }
        if (!action || !action.data || !action.data)
            return { success: false, error: "Failed to retrieve action" };
        const data = action.data as NewVideoData;
        try {
            const response = await axios.post(SUBSCRIBE_URL, qs.stringify({
                "hub.callback": data.webHookUrl,
                "hub.topic": YOUTUBE_WATCH_URL + newVideoConfig.channel,
                "hub.verify": 'async',
                "hub.mode": 'unsubscribe',
                // eslint-disable-next-line @typescript-eslint/camelcase
                "hub.verify_token": "",
                "hub.secret": "",
                // eslint-disable-next-line @typescript-eslint/camelcase
                "hub.lease_seconds": ""
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            console.log(response.statusText);
        } catch (e) {
            console.log(e.request.data);
            console.log(e.response.data);
            return { success: false, options: actionConfig, details: e}
        }
        return { success: true, options: actionConfig };
    }

    static async getConfig(): Promise<ActionConfig> {
        return config as ActionConfig;
    }
}
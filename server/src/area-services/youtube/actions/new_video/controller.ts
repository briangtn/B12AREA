import {get, param, post, requestBody} from "@loopback/rest";
import {ActionConfig, ActionFunction, OperationStatus} from '../../../../services-interfaces'
import config from './config.json';
import {Context, inject} from "@loopback/context";
import {
    ActionRepository,
    UserRepository
} from "../../../../repositories";
import {repository} from "@loopback/repository";
import {YoutubeHelper} from "../../YoutubeHelper";
import {NewVideoConfig, NewVideoData} from "../../interfaces";

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
                        serviceAction: `youtube.A.new_video`
                    },
                    {
                        "data.webHookUrl": `${YoutubeHelper.WEBHOOK_PREFIX}${webhookId}`
                    }
                ]
            }
        });
        if (!action)
            return { error: `Failed to process event: webhook ${webhookId} : webhook not found in database` };
        if (!body.feed.entry)
            return { error: `Failed to process event: webhook ${webhookId} : Invalid data format` };
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

        console.log(this.getActionName());
        return YoutubeHelper.createWebhook(this.getActionName(), newVideoConfig.channel, ctx).then((webhookUrl: string) => {
            const data : NewVideoData = {
                webHookUrl: webhookUrl
            };
            return { success: true, options: actionConfig, data: data};
        }).catch((err) => {
            return { success: false, error: err};
        });
    }

    static async updateAction(actionId: string, oldActionConfig: Object, newActionConfig: Object, ctx: Context): Promise<OperationStatus> {
        const oldActionCfg: NewVideoConfig = oldActionConfig as NewVideoConfig;
        const newActionCfg: NewVideoConfig = newActionConfig as NewVideoConfig;


        if (oldActionCfg.channel === undefined)
            return { success: false, error: "Invalid oldActionConfig" };
        if (newActionCfg.channel === undefined)
            return { success: false, error: "Invalid newActionConfig" };
        if (newActionCfg === oldActionCfg)
            return { success: true, options: oldActionConfig };
        try {
            await this.deleteAction(actionId, oldActionConfig, ctx)
        } catch (e) {
            return { success: false, error: "Failed to remove old webhook", details: e };
        }
        const actionRepository: ActionRepository = await ctx.get('ActionRepository');
        return this.createAction((await actionRepository.getActionOwnerID(actionId))!, newActionCfg, ctx);
    }

    static async deleteAction(actionId: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        const newVideoConfig: NewVideoConfig = actionConfig as NewVideoConfig;

        return YoutubeHelper.deleteWebhook(config.displayName, newVideoConfig.channel, ctx);
    }

    static async getConfig(): Promise<ActionConfig> {
        return config as ActionConfig;
    }

    static getActionName(): string {
        const folders = __dirname.split('/');

        return folders[folders.length - 1];
    }
}
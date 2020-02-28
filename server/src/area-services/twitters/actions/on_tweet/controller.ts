import { Context } from "@loopback/core";
import config from './config.json';
import {ActionConfig, ActionFunction, OperationStatus} from '../../../../services-interfaces';
import {TwitterHelper, Tweet} from '../../helper';
import {AreaService} from '../../../../services';

export interface NewTweet {
    tweet_create_events: Tweet[]
}

interface NewMentionOptions {
    from?: string,
    mustMatch?: string
}

export default class NewTweetActionController {

    static async createAction(userID: string, actionConfig: NewMentionOptions, ctx: Context): Promise<OperationStatus> {
        if (actionConfig.from && !actionConfig.from.startsWith('@')) {
            return {success: false, error: "Invalid from name (must start with '@')"}
        }
        return {success: true, options: actionConfig, data: {}};
    }

    static async updateAction(actionID: string, oldActionConfig: Object, newActionConfig: Object, ctx: Context): Promise<OperationStatus> {
        return {success: true, options: newActionConfig};
    }

    static async deleteAction(actionID: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        return {success: true};
    }

    static async getConfig(): Promise<ActionConfig> {
        return config as ActionConfig;
    }

    static async trigger(rawData: NewTweet, actionID: string, options: NewMentionOptions, userID: string, ctx: Context) {
        const twitterDatas = rawData.tweet_create_events;
        const oauthObject = await TwitterHelper.getOauthObject(userID, ctx);
        const areaService: AreaService = await ctx.get('services.area');

        if (!oauthObject)
            return;
        for (const event of twitterDatas) {
            if (options.mustMatch && !(new RegExp(options.mustMatch).test(event.text)))
                return null;
            let placeholders = [
                {
                    name: 'Author',
                    value: event.user.screen_name
                },
                {
                    name: 'AuthorDisplayName',
                    value: event.user.name
                },
                {
                    name: 'AuthorId',
                    value: event.user.id_str
                },
                {
                    name: 'Message',
                    value: event.text
                }
            ];
            placeholders = placeholders.concat(areaService.createWordsPlaceholders(event.text));
            if (options.mustMatch) {
                placeholders = placeholders.concat(areaService.createRegexPlaceholders(event.text, options.mustMatch, 'Matches'));
            }
            await ActionFunction({
                actionId: actionID,
                placeholders
            }, ctx);
            return null;
        }
    }

}
import { Context } from "@loopback/core";
import config from './config.json';
import {ActionConfig, ActionFunction, OperationStatus} from '../../../../services-interfaces';
import {TwitterHelper} from '../../helper';
import {AreaService} from '../../../../services';

export interface TwitterUser {
    id: number,
    id_str: string,
    name: string,
    screen_name: string
}

export interface TwitterPlace {
    url: string,
    place_type: string,
    name: string,
    full_name: string,
    country_code: string,
    country: string
}

export interface Tweet {
    created_at: string,
    id_str: string,
    text: string,
    source: string,
    user: TwitterUser,
    place: TwitterPlace
}

export interface NewMentionTwitter {
    tweet_create_events: Tweet[]
}

interface NewMentionOptions {
    from?: string,
    mustMatch?: string
}

export default class NewMentionActionController {

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

    static async trigger(rawData: NewMentionTwitter, actionID: string, options: NewMentionOptions, userID: string, ctx: Context) {
        const twitterDatas = rawData.tweet_create_events;
        const oauthObject = await TwitterHelper.getOauthObject(userID, ctx);
        const areaService: AreaService = await ctx.get('services.area');

        if (!oauthObject)
            return;
        for (const event of twitterDatas) {
            if (options.mustMatch && !(new RegExp(options.mustMatch).test(event.text)))
                return null;
            if (options.from && options.from !== '@' + event.user.screen_name)
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
            console.log(placeholders);

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
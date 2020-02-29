import { Context } from "@loopback/core";
import config from './config.json';
import {ActionConfig, ActionFunction, OperationStatus} from '../../../../services-interfaces';
import {EventSetting, TwitterHelper} from '../../helper';
import request from 'request';
import {AreaService} from '../../../../services';

interface NewDMTwitterData {
    type: string,
    id: string,
    created_timestamp: string,
    message_create: {
        target: {
            recipient_id: string
        }
        sender_id: string,
        source_app_id: string,
        message_data: {
            text: string,
            entities: {
                hashtags: string[],
                symbols: string[],
                user_mentions: string[],
                urls: string[]
            }
        }
    }
}

interface NewDmOptions {
    from?: string,
    mustMatch?: string
}

export default class NewDMActionController {

    static async createAction(userID: string, actionConfig: NewDmOptions, ctx: Context): Promise<OperationStatus> {
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

    static async trigger(baseData: {direct_message_events: NewDMTwitterData[]}, actionID: string, options: NewDmOptions, userID: string, eventData: EventSetting, ctx: Context) {
        const twitterDatas = baseData.direct_message_events;
        const oauthObject = await TwitterHelper.getOauthObject(userID, ctx);
        const areaService: AreaService = await ctx.get('services.area');

        console.log("Trigger...");
        if (!oauthObject)
            return;
        for (const event of twitterDatas) {
            if (event.type !== 'message_create')
                continue;
            request.get({
                url: `https://api.twitter.com/1.1/users/lookup.json?user_id=${event.message_create.sender_id}`,
                oauth: oauthObject
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            }, async (err, data, body): Promise<null | undefined> => {
                if (err) {
                    console.error(err);
                    return null;
                }
                const twitterUser: {screen_name: string, name: string} = JSON.parse(body)[0];
                console.log("Trigger...", options);

                if (options.mustMatch && !(new RegExp(options.mustMatch).test(event.message_create.message_data.text)))
                    return null;
                if (options.from && options.from !== '@' + twitterUser.screen_name)
                    return null;
                let placeholders = [
                    {
                        name: 'Author',
                        value: twitterUser.screen_name
                    },
                    {
                        name: 'AuthorDisplayName',
                        value: twitterUser.name
                    },
                    {
                        name: 'AuthorId',
                        value: event.message_create.sender_id
                    },
                    {
                        name: 'Message',
                        value: event.message_create.message_data.text
                    }
                ];

                placeholders = placeholders.concat(areaService.createWordsPlaceholders(event.message_create.message_data.text));
                if (options.mustMatch) {
                    placeholders = placeholders.concat(areaService.createRegexPlaceholders(event.message_create.message_data.text, options.mustMatch, 'Matches'));
                }
                await ActionFunction({
                    actionId: actionID,
                    placeholders
                }, ctx);
                return null;
            })


        }
    }

}
import { Context } from "@loopback/core";
import config from './config.json';
import {ActionConfig, ActionFunction, OperationStatus} from '../../../../services-interfaces';
import {TwitterHelper} from '../../helper';
import {UserRepository} from '../../../../repositories';
import {User} from '../../../../models';

export interface NewFollower {
    follow_events: {
        target: {id: string, name: string, screen_name: string},
        source: {id: string, name: string, screen_name: string}
    }[]
}

interface NewMentionOptions {
    from?: string,
    mustMatch?: string
}

export default class NewFollowerActionController {

    static async createAction(userID: string, actionConfig: NewMentionOptions, ctx: Context): Promise<OperationStatus> {
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

    static async trigger(rawData: NewFollower, actionID: string, options: NewMentionOptions, userID: string, ctx: Context) {
        const twitterDatas = rawData.follow_events;
        const oauthObject = await TwitterHelper.getOauthObject(userID, ctx);
        const userRepository: UserRepository = await ctx.get('repositories.UserRepository');

        let user: User | null = null;
        try {
            user = await userRepository.findById(userID)
        } catch (e) {
            return;
        }
        if (!oauthObject || !user || !user.services || !(user.services as {twitters: object}).twitters)
            return;
        const twitterInfo = (user.services as {twitters: {twitterID: string}}).twitters;
        for (const event of twitterDatas) {
            if (event.target.id !== twitterInfo.twitterID) {
                console.log(event);
                console.log(event.target.id, twitterInfo.twitterID);
                return;
            }
            await ActionFunction({
                actionId: actionID,
                placeholders: [
                    {
                        name: 'Follower',
                        value: event.source.screen_name
                    },
                    {
                        name: 'FollowerDisplayName',
                        value: event.source.name
                    },
                    {
                        name: 'FollowerId',
                        value: event.source.id
                    }
                ]
            }, ctx);
            return null;
        }
    }

}
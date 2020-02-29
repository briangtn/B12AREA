import {applyPlaceholders, OperationStatus, WorkableObject} from '../../../../services-interfaces';
import { Context } from '@loopback/core';
import config from './config.json';
import {ReactionRepository} from '../../../../repositories';
import {AreaService} from '../../../../services';
import {TwitterHelper} from '../../helper';
import request from 'request';
import url from 'url';

interface TweetOptions {
    content: string
}

export default class ReactionController {

    static async trigger(params: WorkableObject): Promise<void> {
        const options : TweetOptions = params.reactionOptions as TweetOptions;
        const content = applyPlaceholders(options.content, params.actionPlaceholders);
        const oauth = (params.reactionPreparedData as {oauth: {consumer_key: string, consumer_secret: string, token: string, token_secret: string}}).oauth;
        const urlToSend = 'https://api.twitter.com/1.1/statuses/update.json?status=' + url.format(content) + '&auto_populate_reply_metadata=true';
        request.post({url: urlToSend, oauth: oauth}, (err, data, body) => {
            if (err)
                return console.error(err);
        })
    }

    static async prepareData(reactionId: string, ctx: Context): Promise<object> {
        const reactionRepository: ReactionRepository = await ctx.get('repositories.ReactionRepository');

        const userID = await reactionRepository.getReactionOwnerID(reactionId);
        if (!userID) {
            const error = { success: false, error: "User not found" };
            throw error;
        }
        const oauth = await TwitterHelper.getOauthObject(userID, ctx);
        return {oauth};
    }

    static async createReaction(userId: string, reactionConfig: TweetOptions, ctx: Context): Promise<OperationStatus> {
        let areaService : AreaService | undefined = undefined;
        try {
            areaService = await ctx.get('services.area');
        } catch (e) {
            const error = { success: false, error: "Failed to resolve services", detail: e };
            throw error;
        }
        if (!areaService) {
            const error = { success: false, error: "Failed to resolve services" };
            throw error;
        }

        const configValidation = areaService.validateConfigSchema(reactionConfig, config.configSchema);
        if (!configValidation.success)
            return configValidation;

        return {
            success: true,
            options: reactionConfig
        };
    }

    static async updateReaction(reactionId: string, oldReactionConfig: TweetOptions, newReactionConfig: TweetOptions, ctx: Context): Promise<OperationStatus> {
        let areaService : AreaService | undefined = undefined;
        try {
            areaService = await ctx.get('services.area');
        } catch (e) {
            const error = { success: false, error: "Failed to resolve services", detail: e };
            throw error;
        }
        if (!areaService) {
            const error = { success: false, error: "Failed to resolve services" };
            throw error;
        }

        const configValidation = areaService.validateConfigSchema(newReactionConfig, config.configSchema);
        if (!configValidation.success)
            return configValidation;

        return {
            success: true,
            options: newReactionConfig
        };
    }

    static async deleteReaction(reactionId: string, reactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        return {success: true, options: reactionConfig};
    }

    static async getConfig(): Promise<object> {
        return config;
    }

}
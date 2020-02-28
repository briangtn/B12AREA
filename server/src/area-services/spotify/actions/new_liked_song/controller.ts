import { Context } from "@loopback/core";
import config from './config.json';
import {ActionConfig, OperationStatus} from '../../../../services-interfaces';
import {ActionRepository} from '../../../../repositories';
import {SpotifyHelper} from '../../helper';

export default class ActionController {

    static async createAction(userID: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        const configTyped = actionConfig as {id: string};

        return {success: true, options: {id: configTyped.id}, data: {lastDate: new Date().toISOString()}};
    }

    static async createActionFinished(actionID: string, userID: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        await SpotifyHelper.startNewLikedSongPulling(actionID, userID, ctx);
        return {success: true}
    }

    static async updateAction(actionID: string, oldActionConfig: Object, newActionConfig: Object, ctx: Context): Promise<OperationStatus> {
        const actionRepository: ActionRepository = await ctx.get('repositories.ActionRepository');

        await SpotifyHelper.stopNewLikedSongPulling(actionID, ctx);
        await SpotifyHelper.startNewLikedSongPulling(actionID, (await actionRepository.getActionOwnerID(actionID))!, ctx);
        return {success: true};
    }

    static async deleteAction(actionID: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        await SpotifyHelper.stopNewLikedSongPulling(actionID, ctx);
        return {success: true};
    }

    static async getConfig(): Promise<ActionConfig> {
        return config as ActionConfig;
    }



}
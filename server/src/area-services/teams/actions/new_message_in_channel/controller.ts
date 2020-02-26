import {ActionConfig, OperationStatus} from '../../../../services-interfaces'
import config from './config.json';
import {Context, inject} from "@loopback/context";
import {TeamsHelper, TeamsNewMessageInChannelOptions} from "../../helper";

interface RawActionConfig {
    channelUrl?: string;
    mustMatch?: string;
}

export default class ActionController {

    constructor(
        @inject.context() private ctx: Context
    ) {}

    static async parseAndValidateActionConfig(actionConfig: RawActionConfig): Promise<TeamsNewMessageInChannelOptions> {
        const failure : OperationStatus = {success: false};
        if (!actionConfig.channelUrl) {
            failure.error = 'Missing channel link';
            throw failure;
        }
        const re = new RegExp('^https:\\/\\/teams\\.microsoft\\.com\\/l\\/channel\\/([^\\/]+)\\/[^?]+\\?groupId=([^&]+)&tenantId=([A-Za-z0-9\\-]+)$');
        if (!re.test(actionConfig.channelUrl)) {
            failure.error = 'Invalid channel link';
            throw failure;
        }
        const groups = actionConfig.channelUrl.match(re);
        const mustMatch = actionConfig.mustMatch;
        const teamId = groups![2];
        const channelId = decodeURIComponent(groups![1]);
        const tenantId = groups![3];
        if (tenantId !== TeamsHelper.getTenantId()) {
            failure.error = 'Invalid tenant ID, you probably didn\'t entered a team channel that doesn\'t belong to B12Powered teams';
            throw failure;
        }

        return {
            mustMatch: mustMatch,
            teamId: teamId,
            channelId: channelId
        }
    }

    static async createAction(userId: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        let newConfig: TeamsNewMessageInChannelOptions | undefined = undefined;
        try {
            newConfig = await this.parseAndValidateActionConfig(actionConfig);
        } catch (e) {
            return e;
        }
        return { success: true, options: newConfig, data: { lastPulled: new Date().toISOString() } };
    }

    static async createActionFinished(actionID: string, userID: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        await TeamsHelper.startNewMessageInChannelPulling(actionID, userID, ctx);
        return {success: true}
    }

    static async updateAction(actionId: string, oldActionConfig: Object, newActionConfig: Object, ctx: Context): Promise<OperationStatus> {
        let newConfig: TeamsNewMessageInChannelOptions | undefined = undefined;
        try {
            newConfig = await this.parseAndValidateActionConfig(newActionConfig);
        } catch (e) {
            return e;
        }
        await TeamsHelper.stopNewMessageInChannelPulling(actionId, ctx);
        return { success: true, options: newConfig, data: { lastPulled: new Date().toISOString() } };
    }

    static async updateActionFinished(actionID: string, userID: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        await TeamsHelper.startNewMessageInChannelPulling(actionID, userID, ctx);
        return {success: true}
    }

    static async deleteAction(actionId: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        await TeamsHelper.stopNewMessageInChannelPulling(actionId, ctx);
        return { success: true, options: actionConfig };
    }

    static async getConfig(): Promise<ActionConfig> {
        return config as ActionConfig;
    }
}
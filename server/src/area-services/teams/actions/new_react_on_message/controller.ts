import {ActionConfig, OperationStatus} from '../../../../services-interfaces'
import config from './config.json';
import {Context, inject} from "@loopback/context";
import {TeamsHelper, TeamsNewReactOnMessageOptions} from "../../helper";

interface RawActionConfig {
    messageUrl?: string;
    onlyTypeOf?: string;
}

export default class ActionController {

    constructor(
        @inject.context() private ctx: Context
    ) {}

    static async parseAndValidateActionConfig(actionConfig: RawActionConfig): Promise<TeamsNewReactOnMessageOptions> {
        const failure : OperationStatus = {success: false};
        if (!actionConfig.messageUrl) {
            failure.error = 'Missing message link';
            throw failure;
        }
        if (actionConfig.onlyTypeOf) {
            const allowedTypes = ['like', 'angry', 'sad', 'laugh', 'heart', 'surprised'];
            let isValid = false;
            for (const allowedType of allowedTypes) {
                if (allowedType === actionConfig.onlyTypeOf)
                    isValid = true;
            }
            if (!isValid) {
                failure.error = `Invalid onlyTypeOf, allowed values are ${allowedTypes.concat(',')}`;
                throw failure;
            }
        }
        const re = new RegExp('^https:\\/\\/teams\\.microsoft\\.com\\/l\\/message\\/([^\\/]+)\\/([^\\?]+)\\?tenantId=([^&]+)&groupId=([^&]+)&parentMessageId=[^&]+&teamName=[^&]+&channelName=[^&]+&createdTime=[0-9]+$')
        if (!re.test(actionConfig.messageUrl)) {
            failure.error = 'Invalid message link';
            throw failure;
        }
        const groups = actionConfig.messageUrl.match(re);
        const onlyTypeOf = actionConfig.onlyTypeOf;
        const channelId = groups![1];
        const messageId = groups![2];
        const tenantId = groups![3];
        const teamId = groups![4];
        if (tenantId !== TeamsHelper.getTenantId()) {
            failure.error = 'Invalid tenant ID, you probably didn\'t entered a team channel that doesn\'t belong to B12Powered teams';
            throw failure;
        }

        return {
            teamId: teamId,
            channelId: channelId,
            messageId: messageId,
            onlyTypeOf: onlyTypeOf
        }
    }

    static async createAction(userId: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        let newConfig: TeamsNewReactOnMessageOptions | undefined = undefined;
        try {
            newConfig = await this.parseAndValidateActionConfig(actionConfig);
        } catch (e) {
            return e;
        }
        return { success: true, options: newConfig, data: { lastPulled: new Date().toISOString() } };
    }

    static async createActionFinished(actionID: string, userID: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        await TeamsHelper.startNewReactOnMessagePulling(actionID, userID, ctx);
        return {success: true}
    }

    static async updateAction(actionId: string, oldActionConfig: Object, newActionConfig: Object, ctx: Context): Promise<OperationStatus> {
        let newConfig: TeamsNewReactOnMessageOptions | undefined = undefined;
        try {
            newConfig = await this.parseAndValidateActionConfig(newActionConfig);
        } catch (e) {
            return e;
        }
        await TeamsHelper.stopNewReactOnMessagePulling(actionId, ctx);
        return { success: true, options: newConfig, data: { lastPulled: new Date().toISOString() } };
    }

    static async updateActionFinished(actionID: string, userID: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        await TeamsHelper.startNewReactOnMessagePulling(actionID, userID, ctx);
        return {success: true}
    }

    static async deleteAction(actionId: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        await TeamsHelper.stopNewReactOnMessagePulling(actionId, ctx);
        return { success: true, options: actionConfig };
    }

    static async getConfig(): Promise<ActionConfig> {
        return config as ActionConfig;
    }
}
import {ActionConfig, OperationStatus} from '../../../../services-interfaces'
import config from './config.json';
import {Context, inject} from "@loopback/context";
import {AreaService} from "../../../../services";
import {AirtableHelper} from "../../Airtable.helper";

export default class ActionController {

    constructor(
        @inject.context() private ctx: Context
    ) {}

    static async createAction(userId: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        return {
            success: true,
            options: actionConfig
        }
    }

    static async createActionFinished(actionID: string, userID: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        const areaService: AreaService = await ctx.get('services.area');
        try {
            await areaService.startPulling(30, AirtableHelper.AIRTABLE_PULLING_PREFRIX_FIELD_UPDATE + actionID, AirtableHelper.serviceName, ctx, {
                ...actionConfig,
                actionID
            });
            return { success: true};
        } catch (e) {
            return { success: false, error: e };
        }
    }

    static async updateAction(actionId: string, oldActionConfig: Object, newActionConfig: Object, ctx: Context): Promise<OperationStatus> {
        return { success: true, options: { thisShouldContains: "data to be stored" } };
    }

    static async deleteAction(actionId: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        const areaService: AreaService = await ctx.get('services.area');
        try {
            await areaService.stopPulling(AirtableHelper.AIRTABLE_PULLING_PREFRIX_FIELD_UPDATE + actionId, AirtableHelper.serviceName, ctx);
            return { success: true, options: actionConfig };
        } catch (e) {
            return { success: false, error: e };
        }
    }

    static async getConfig(): Promise<ActionConfig> {
        return config as ActionConfig;
    }
}
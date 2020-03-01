import {Context, inject} from "@loopback/context";
import {OperationStatus} from "../../../services-interfaces";
import {AreaService} from "../../../services";
import {AirtableHelper, DiffHandler} from "../Airtable.helper";
import {Record} from "../interfaces";

export enum AIRTABLE_PREFIX_ENUM {
    UPDATED = "updated",
    CREATED = "created",
    DELETED = "delete"
}

export default class DetectChangesHelper {
    static readonly diffCheckers = new Map<string, DiffHandler>([
        [AIRTABLE_PREFIX_ENUM.CREATED, DetectChangesHelper.diffCheckerCreated],
        [AIRTABLE_PREFIX_ENUM.UPDATED, DetectChangesHelper.diffCheckerUpdated],
        [AIRTABLE_PREFIX_ENUM.DELETED, DetectChangesHelper.diffCheckerDeleted]
    ]);

    static getPrefix(type: AIRTABLE_PREFIX_ENUM) : string {
        return `${AirtableHelper.AIRTABLE_PULLING_PREFIX}_${type}`
    }

    static async createAction(userId: string, actionConfig: Object, ctx: Context, prefix: AIRTABLE_PREFIX_ENUM): Promise<OperationStatus> {
        return {
            success: true,
            options: actionConfig
        }
    }

    static async createActionFinished(actionID: string, userID: string, actionConfig: Object, ctx: Context, prefix: AIRTABLE_PREFIX_ENUM): Promise<OperationStatus> {
        const areaService: AreaService = await ctx.get('services.area');
        try {
            await areaService.startPulling(30, this.getPrefix(prefix) + actionID, AirtableHelper.serviceName, ctx, {
                ...actionConfig,
                actionID
            });
            return { success: true};
        } catch (e) {
            return { success: false, error: e };
        }
    }

    static async updateAction(actionId: string, oldActionConfig: Object, newActionConfig: Object, ctx: Context, prefix: AIRTABLE_PREFIX_ENUM): Promise<OperationStatus> {
        const areaService: AreaService = await ctx.get('services.area');
        try {
            await areaService.stopPulling(this.getPrefix(prefix) + actionId, AirtableHelper.serviceName, ctx);

            await areaService.startPulling(30, this.getPrefix(prefix) + actionId, AirtableHelper.serviceName, ctx, {
                ...newActionConfig,
                actionId
            });
            return { success: true, options: newActionConfig };
        } catch (e) {
            return { success: false, error: e };
        }
    }

    static async deleteAction(actionId: string, actionConfig: Object, ctx: Context, prefix: AIRTABLE_PREFIX_ENUM): Promise<OperationStatus> {
        const areaService: AreaService = await ctx.get('services.area');
        try {
            await areaService.stopPulling(this.getPrefix(prefix) + actionId, AirtableHelper.serviceName, ctx);
            return { success: true, options: actionConfig };
        } catch (e) {
            return { success: false, error: e };
        }
    }

    private static diffCheckerCreated(oldEntry: Record[], newEntry: Record[]) : Record[] {
        return [];
    }

    private static diffCheckerUpdated(oldEntry: Record[], newEntry: Record[]) : Record[] {
        return [];
    }

    private static diffCheckerDeleted(oldEntry: Record[], newEntry: Record[]) : Record[] {
        return [];
    }
}
import {Context, inject} from "@loopback/context";
import {OperationStatus} from "../../../services-interfaces";
import {AreaService} from "../../../services";
import {AirtableHelper, DiffHandler} from "../Airtable.helper";
import {BaseConfig, Record} from "../interfaces";
import {isDeepStrictEqual} from "util";

export enum AIRTABLE_PREFIX_ENUM {
    UPDATED = "updated",
    CREATED = "created",
    DELETED = "deleted"
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

    private static checkConfig(actionConfig: Object) : boolean {
        const config : BaseConfig = actionConfig as BaseConfig;

        return !(config.tableId === "" || config.baseId === "" || config.apiKey === "");
    }

    static async createActionFinished(actionID: string, userID: string, actionConfig: Object, ctx: Context, prefix: AIRTABLE_PREFIX_ENUM): Promise<OperationStatus> {
        const areaService: AreaService = await ctx.get('services.area');
        if (!this.checkConfig(actionConfig)) {
            return { success: false, error: "Invalid configuration" };
        }
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
        if (!this.checkConfig(newActionConfig)) {
            return { success: false, error: "Invalid configuration" };
        }
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

    private static diffCheckerCreated(oldEntries: Record[], newEntries: Record[]) : Record[] {
        const diff: Record[] = [];

        for (const newEntry of newEntries) {
            const oldVersion: Record | undefined = oldEntries.find((value: Record) => {
                return value.id === newEntry.id;
            });
            if (oldVersion === undefined)
                diff.push(newEntry);
        }
        return diff;
    }

    private static diffCheckerUpdated(oldEntries: Record[], newEntries: Record[]) : Record[] {
        const diff: Record[] = [];

        for (const newEntry of newEntries) {
            const oldVersion: Record | undefined = oldEntries.find((value: Record) => {
                return value.id === newEntry.id;
            });
            if (oldVersion !== undefined && !isDeepStrictEqual(newEntry, oldVersion))
                diff.push(newEntry);
        }
        return diff;
    }

    private static diffCheckerDeleted(oldEntries: Record[], newEntries: Record[]) : Record[] {
        const diff: Record[] = [];

        if (oldEntries === undefined)
            return [];
        for (const oldEntry of oldEntries) {
            const newVersion: Record | undefined = newEntries.find((value: Record) => {
                return value.id === oldEntry.id;
            });
            if (newVersion === undefined)
                diff.push(oldEntry);
        }
        return diff;
    }
}
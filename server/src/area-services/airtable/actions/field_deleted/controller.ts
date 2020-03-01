import {ActionConfig, OperationStatus} from '../../../../services-interfaces'
import config from './config.json';
import {Context, inject} from "@loopback/context";
import DetectChangesHelper, {AIRTABLE_PREFIX_ENUM} from "../DetectChange.helper";

export default class ActionController {

    constructor(
        @inject.context() private ctx: Context
    ) {}

    private static readonly type : AIRTABLE_PREFIX_ENUM = AIRTABLE_PREFIX_ENUM.DELETED;

    static async createAction(userId: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        return DetectChangesHelper.createAction(userId, actionConfig, ctx, this.type);
    }

    static async createActionFinished(actionID: string, userID: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        return DetectChangesHelper.createActionFinished(actionID, userID, actionConfig, ctx, this.type);
    }

    static async updateAction(actionId: string, oldActionConfig: Object, newActionConfig: Object, ctx: Context): Promise<OperationStatus> {
        return DetectChangesHelper.updateAction(actionId, oldActionConfig, newActionConfig, ctx, this.type);
    }

    static async deleteAction(actionId: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        return DetectChangesHelper.deleteAction(actionId, actionConfig, ctx, this.type);
    }

    static async getConfig(): Promise<ActionConfig> {
        return config as ActionConfig;
    }
}
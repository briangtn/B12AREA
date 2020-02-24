import {param, post} from "@loopback/rest";
import {ActionConfig, ActionFunction, OperationStatus} from '../../../../services-interfaces'
import config from './config.json';
import {Context, inject} from "@loopback/context";

export default class ActionController {

    constructor(
        @inject.context() private ctx: Context
    ) {}

    @post('/webhook/{webhookId}')
    async webhook(
        @param.path.string('webhookId') webhookId: string,
    ) {
        // Enqueue reactions that belongs to actionId action
        return ActionFunction({
            actionId: "This should be the id of the action that was triggered",
            placeholders: [
                {
                    name: "PlaceholderName",
                    value: "placeholderValue"
                }
            ]
        }, this.ctx);
    }

    static async createAction(userId: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        // If successful
        return { success: true, options: { thisShouldContains: "data to be stored" } };
        // If an error occurs
        // return { success: false, error: 'Error returned to front end', details: { backEndDebugDetails: "this is just an example details it is not required" } };
    }

    static async updateAction(actionId: string, oldActionConfig: Object, newActionConfig: Object, ctx: Context): Promise<OperationStatus> {
        // If successful
        return { success: true, options: { thisShouldContains: "data to be stored" } };
        // If an error occurs
        // return { success: false, error: 'Error returned to front end', details: { backEndDebugDetails: "this is just an example details it is not required" } };
    }

    static async deleteAction(actionId: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        // If successful
        return { success: true, options: { thisShouldContains: "data to be stored" } };
        // If an error occurs
        // return { success: false, error: 'Error returned to front end', details: { backEndDebugDetails: "this is just an example details it is not required" } };
    }

    static async getConfig(): Promise<ActionConfig> {
        return config as ActionConfig;
    }
}
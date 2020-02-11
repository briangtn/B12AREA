import {post} from "@loopback/rest";
import {ActionConfig, ActionFunction, OperationStatus} from '../../../../services-interfaces'
import config from './config.json';
import {Context, inject} from "@loopback/context";

export default class ActionController {

    constructor(@inject.context() private ctx: Context) {}

    @post('/webhook')
    async webhook() {
        //todo
        await ActionFunction({
            actionId: "TODO",//todo
            placeholders: [{
                name: "toReplace",
                value: "Replacement value"
            }]
        }, this.ctx);
    }

    static async createAction(actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        //todo
        return {
            success: true,
            error: undefined,
            options: {}
        }
    }

    static async updateAction(actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        //todo
        return {
            success: true,
            error: undefined,
            options: {}
        }
    }

    static async deleteAction(actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        //todo
        return {
            success: true,
            error: undefined,
            options: {}
        }
    }

    static getConfig(): ActionConfig {
        return config as ActionConfig;
    }
}
import {post} from "@loopback/rest";
import {ActionConfig, ActionFunction, OperationStatus} from '../../../../services-interfaces'
import config from './config.json';

export default class ActionController {

    constructor() {}

    @post('/webhook')
    webhook() {
        ActionFunction({
            from: "github.push",
            placeholders: [{
                name: "toReplace",
                value: "Replacement value"
            }]
        });
    }

    static async createAction(actionConfig: Object): Promise<OperationStatus> {
        return {
            success: true,
            error: undefined,
            options: {}
        }
    }

    static async updateAction(actionConfig: Object): Promise<OperationStatus> {
        return {
            success: true,
            error: undefined,
            options: {}
        }
    }

    static async deleteAction(actionConfig: Object): Promise<OperationStatus> {
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
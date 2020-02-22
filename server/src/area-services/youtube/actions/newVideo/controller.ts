import {param, post} from "@loopback/rest";
import {ActionConfig, OperationStatus} from '../../../../services-interfaces'
import config from './config.json';
import {Context, inject} from "@loopback/context";
import {
    UserRepository
} from "../../../../repositories";
import {repository} from "@loopback/repository";

export default class ActionController {

    constructor(
        @inject.context() private ctx: Context,
        @repository(UserRepository) public userRepository: UserRepository,
    ) {}

    @post('/webhook/{webhookId}')
    async webhook(
        @param.path.string('webhookId') webhookId: string,
    ) {
    }

    static async createAction(userId: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        return { success: true, options: actionConfig}
    }

    static async updateAction(actionId: string, oldActionConfig: Object, newActionConfig: Object, ctx: Context): Promise<OperationStatus> {
        return { success: true, options: newActionConfig}
    }

    static async deleteAction(actionId: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        return { success: true, options: actionConfig }
    }

    static async getConfig(): Promise<ActionConfig> {
        return config as ActionConfig;
    }
}
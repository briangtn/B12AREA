import {OperationStatus, ReactionConfig, WorkableObject} from "../../../../services-interfaces";
import config from './config.json';
import {Context} from "@loopback/context";

export default class ReactionController {
    static async trigger(params: WorkableObject): Promise<void> {
        //todo

    }

    static async prepareData(reactionId: string, ctx: Context): Promise<object> {
        //todo
        return {};
    }

    static async createReaction(actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        //todo
        return {
            success: true,
            error: undefined,
            options: {}
        }
    }

    static async updateReaction(actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        //todo
        return {
            success: true,
            error: undefined,
            options: {}
        }
    }

    static async deleteReaction(actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        //todo
        return {
            success: true,
            error: undefined,
            options: {}
        }
    }

    static getConfig(): ReactionConfig {
        return config as ReactionConfig;
    }
}
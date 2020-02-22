import {OperationStatus, ReactionConfig, WorkableObject} from "../../../../services-interfaces";
import config from './config.json';
import {Context} from "@loopback/context";


export default class ReactionController {
    static async trigger(params: WorkableObject): Promise<void> {
        console.log(params);

    }

    static async prepareData(reactionId: string, ctx: Context): Promise<object> {
        return {}
    }

    static async createReaction(userId: string, reactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        return {
            success: true,
            options: reactionConfig
        }
    }

    static async updateReaction(reactionId: string, oldReactionConfig: Object, newReactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        return {
            success: true,
            options: newReactionConfig
        }
    }

    static async deleteReaction(reactionId: string, reactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        return {
            success: true,
            options: reactionConfig
        }
    }

    static async getConfig(): Promise<ReactionConfig> {
        return config as ReactionConfig;
    }
}
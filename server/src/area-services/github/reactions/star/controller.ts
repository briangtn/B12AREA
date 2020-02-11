import {OperationStatus, ReactionConfig, TriggerObject} from "../../../../services-interfaces";
import config from './config.json';

export default class ReactionController {
    static trigger(params: TriggerObject): void {
        console.log("Example reaction triggered from ", params.from, " with the following placeholders: ", params.placeholders);
    }

    static async createReaction(actionConfig: Object): Promise<OperationStatus> {
        return {
            success: true,
            error: undefined,
            options: {}
        }
    }

    static async updateReaction(actionConfig: Object): Promise<OperationStatus> {
        return {
            success: true,
            error: undefined,
            options: {}
        }
    }

    static async deleteReaction(actionConfig: Object): Promise<OperationStatus> {
        return {
            success: true,
            error: undefined,
            options: {}
        }
    }

    static getConfig(): ReactionConfig {
        return config;
    }
}
import {OperationStatus, ReactionConfig, WorkableObject} from "../../../../services-interfaces";
import config from './config.json';
import {Context} from "@loopback/context";

export default class ReactionController {
    static async trigger(params: WorkableObject): Promise<void> {
        console.log(params);
    }

    static async prepareData(reactionId: string, ctx: Context): Promise<object> {
        const hasError = false;
        if (hasError) {
            const error = { success: false, error: 'Error message' };
            throw error;
        }
        return {};
    }

    static async createReaction(userId: string, reactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        // If successful
        return { success: true, options: { thisShouldContains: "data to be stored" } };
        // If an error occurs
        // return { success: false, error: 'Error returned to front end', details: { backEndDebugDetails: "this is just an example details it is not required" } };
    }

    static async updateReaction(reactionId: string, oldReactionConfig: Object, newReactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        // If successful
        return { success: true, options: { thisShouldContains: "data to be stored" } };
        // If an error occurs
        // return { success: false, error: 'Error returned to front end', details: { backEndDebugDetails: "this is just an example details it is not required" } };
    }

    static async deleteReaction(reactionId: string, reactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        // If successful
        return { success: true, options: { thisShouldContains: "data to be stored" } };
        // If an error occurs
        // return { success: false, error: 'Error returned to front end', details: { backEndDebugDetails: "this is just an example details it is not required" } };
    }

    static async getConfig(): Promise<ReactionConfig> {
        return config as ReactionConfig;
    }
}
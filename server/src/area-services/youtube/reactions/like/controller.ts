import {RateEnum, RateReactionHelper} from "../RateReaction";
import {OperationStatus, ReactionConfig, WorkableObject} from "../../../../services-interfaces";
import config from './config.json';
import {Context} from "@loopback/context";

export default class ReactionController {
    private static rate: RateEnum = RateEnum.LIKE;

    static async trigger(params: WorkableObject): Promise<void> {
        return RateReactionHelper.trigger(params);
    }

    static async prepareData(reactionId: string, ctx: Context): Promise<object> {
        return RateReactionHelper.prepareData(reactionId, ctx);
    }

    static async createReaction(userId: string, reactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        return RateReactionHelper.createReaction(userId, reactionConfig, ctx, this.rate);
    }

    static async updateReaction(reactionId: string, oldReactionConfig: Object, newReactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        return RateReactionHelper.updateReaction(reactionId, oldReactionConfig, newReactionConfig, ctx, this.rate);
    }

    static async deleteReaction(reactionId: string, reactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        return RateReactionHelper.deleteReaction(reactionId, reactionConfig, ctx);
    }

    static async getConfig(): Promise<ReactionConfig> {
        return config as ReactionConfig;
    }
}
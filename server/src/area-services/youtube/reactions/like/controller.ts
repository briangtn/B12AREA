import {applyPlaceholders, OperationStatus, ReactionConfig, WorkableObject} from "../../../../services-interfaces";
import config from './config.json';
import {Context} from "@loopback/context";
import axios from "axios";
import ServiceController from "../../controller";

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3/videos";
const YOUTUBE_API_KEY : string = process.env.YOUTUBE_API_KEY ?? "";

interface RateReactionOptions {
    userId: string,
    video: string,
    rate: string
}

export default class ReactionController {
    static rate = 'like';

    static async trigger(params: WorkableObject): Promise<void> {
        console.log(params);
        const reactionOptions: RateReactionOptions = params.reactionOptions as RateReactionOptions;

        const video = applyPlaceholders(reactionOptions.video, params.actionPlaceholders);
        const bearerToken = "";

        let url = `${YOUTUBE_API_BASE_URL}/rate`;
        url += '?id=' + video;
        url += '&rating=' + reactionOptions.rate;
        url += '&key=' + YOUTUBE_API_KEY;

        try {
            await axios.post(url, {}, {
                headers: {
                    Authorization: `Bearer ${bearerToken}`
                }
            });
        } catch (e) {
            console.debug(`Failed to rate video`, e);
            return;
        }
    }

    static async prepareData(reactionId: string, ctx: Context): Promise<object> {
        return {}
    }

    static async createReaction(userId: string, reactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        const rateReactionConfig : RateReactionOptions = reactionConfig as RateReactionOptions;
        if (!rateReactionConfig.video) {
            return {success: false, error: "Missing video id in config"};
        }

        return {
            success: true,
            options: {
                userId: userId,
                video: rateReactionConfig.video,
                rate: this.rate
            }
        }
    }

    static async updateReaction(reactionId: string, oldReactionConfig: Object, newReactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        const newRateReactionConfig : RateReactionOptions = newReactionConfig as RateReactionOptions;
        if (!newRateReactionConfig.video) {
            return {success: false, error: "Missing video id in config"};
        }
        const oldForkReactionConfig : RateReactionOptions = oldReactionConfig as RateReactionOptions;
        if (!oldForkReactionConfig.video || !oldForkReactionConfig.rate || !oldForkReactionConfig.userId) {
            return {success: false, error: "Error with stored config please contact area help team."};
        }
        return {
            success: true,
            options: {
                userId: oldForkReactionConfig.userId,
                video: newRateReactionConfig.video,
                rate: this.rate
            }
        };
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
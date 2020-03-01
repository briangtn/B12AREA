import {applyPlaceholders, OperationStatus, WorkableObject} from '../../../../services-interfaces';
import { Context } from '@loopback/core';
import config from './config.json';
import {ReactionRepository, UserRepository} from '../../../../repositories';
import {AreaService} from '../../../../services';
import {Reaction} from '../../../../models';
import axios from 'axios';

const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";

interface PlaySoundReactionConfig {
    id: string;
}

interface PlaySoundOptions {
    userId: string;
    trackId: string;
}

export default class ReactionController {

    static async trigger(params: WorkableObject): Promise<void> {
        const playSoundConfig : PlaySoundOptions = params.reactionOptions as PlaySoundOptions;
        const id = applyPlaceholders(playSoundConfig.trackId, params.actionPlaceholders);
        const spotifyToken = (params.reactionPreparedData as {spotifyToken: string}).spotifyToken;
        try {
            await axios.post(`${SPOTIFY_API_BASE_URL}/me/player/add-to-queue?uri=spotify:track:${id}`, {}, {
                headers: {
                    Authorization: `Bearer ${spotifyToken}`
                }
            });
        } catch (e) {
            return;
        }
    }

    static async prepareData(reactionId: string, ctx: Context): Promise<object> {
        let reactionRepository : ReactionRepository | undefined = undefined;
        let userRepository : UserRepository | undefined = undefined;
        try {
            userRepository = await ctx.get('repositories.UserRepository');
            reactionRepository = await ctx.get('repositories.ReactionRepository');
        } catch (e) {
            const error = { success: false, error: "Failed to resolve repositories", detail: e };
            throw error;
        }
        if (!userRepository || !reactionRepository) {
            const error = { success: false, error: "Failed to resolve repositories" };
            throw error;
        }
        const reaction: Reaction = await reactionRepository.findById(reactionId);
        const reactionConfig : PlaySoundOptions = reaction.options as PlaySoundOptions;
        let spotifyToken : {token: string} | null = null;
        try {
            spotifyToken = await userRepository.getServiceInformation(reactionConfig.userId, 'spotify') as {token: string};
        } catch (e) {
            const error = { success: false, error: "Failed to resolve spotify token", details: e };
            throw error;
        }
        if (!spotifyToken) {
            const error = { success: false, error: `Failed to resolve spotify token for user ${reactionConfig.userId}` };
            throw error;
        }
        return {spotifyToken: spotifyToken.token};
    }

    static async createReaction(userId: string, reactionConfig: PlaySoundReactionConfig, ctx: Context): Promise<OperationStatus> {
        let areaService : AreaService | undefined = undefined;
        try {
            areaService = await ctx.get('services.area');
        } catch (e) {
            const error = { success: false, error: "Failed to resolve services", detail: e };
            throw error;
        }
        if (!areaService) {
            const error = { success: false, error: "Failed to resolve services" };
            throw error;
        }

        const configValidation = areaService.validateConfigSchema(reactionConfig, config.configSchema);
        if (!configValidation.success)
            return configValidation;

        return {
            success: true,
            options: {
                userId,
                trackId: reactionConfig.id
            }
        };
    }

    static async updateReaction(reactionId: string, oldReactionConfig: PlaySoundOptions, newReactionConfig: PlaySoundReactionConfig, ctx: Context): Promise<OperationStatus> {
        let areaService : AreaService | undefined = undefined;
        try {
            areaService = await ctx.get('services.area');
        } catch (e) {
            const error = { success: false, error: "Failed to resolve services", detail: e };
            throw error;
        }
        if (!areaService) {
            const error = { success: false, error: "Failed to resolve services" };
            throw error;
        }

        const configValidation = areaService.validateConfigSchema(newReactionConfig, config.configSchema);
        if (!configValidation.success)
            return configValidation;
        if (!oldReactionConfig.userId)
            return {success: false, error: "Error with stored config please contact area help team."};

        return {
            success: true,
            options: {
                userId: oldReactionConfig.userId,
                trackId: newReactionConfig.id
            }
        };
    }

    static async deleteReaction(reactionId: string, reactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        return {success: true, options: reactionConfig};
    }

    static async getConfig(): Promise<object> {
        return config;
    }

}
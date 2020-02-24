import {OperationStatus, WorkableObject} from '../../../../services-interfaces';
import { Context } from '@loopback/core';
import config from './config.json';
import {ReactionRepository, UserRepository} from '../../../../repositories';
import {AreaService} from '../../../../services';
import {Reaction} from '../../../../models';
import axios from 'axios';

const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";

interface PlayPauseReactionConfig {
    play: boolean;
    swapStatus: boolean;
}

interface PlayPauseOptions {
    userId: string;
    play: boolean;
    swapStatus: boolean;
}

export default class ReactionController {

    static async trigger(params: WorkableObject): Promise<void> {
        const playPauseConfig : PlayPauseOptions = params.reactionOptions as PlayPauseOptions;
        const spotifyToken = (params.reactionPreparedData as {spotifyToken: string}).spotifyToken;

        if (playPauseConfig.swapStatus) {
            try {
                const play = (await axios.get(`${SPOTIFY_API_BASE_URL}/me/player`, {
                    headers: {
                        Authorization: `Bearer ${spotifyToken}`
                    }
                }) as {data: {is_playing: boolean}}).data.is_playing;

                let url = `${SPOTIFY_API_BASE_URL}/me/player/play`;
                if (play) {
                    url = `${SPOTIFY_API_BASE_URL}/me/player/pause`;
                }
                await axios.put(url, {}, {
                    headers: {
                        Authorization: `Bearer ${spotifyToken}`
                    }
                });
            } catch (e) {
                return;
            }
            return;
        }
        try {
            let url = `${SPOTIFY_API_BASE_URL}/me/player/play`;
            if (!playPauseConfig.play) {
                url = `${SPOTIFY_API_BASE_URL}/me/player/pause`;
            }
            await axios.put(url, {}, {
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
        const reactionConfig : PlayPauseOptions = reaction.options as PlayPauseOptions;
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

    static async createReaction(userId: string, reactionConfig: PlayPauseReactionConfig, ctx: Context): Promise<OperationStatus> {
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
                play: reactionConfig.play,
                swapStatus: reactionConfig.swapStatus
            }
        };
    }

    static async updateReaction(reactionId: string, oldReactionConfig: PlayPauseOptions, newReactionConfig: PlayPauseReactionConfig, ctx: Context): Promise<OperationStatus> {
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
                play: newReactionConfig.play,
                swapStatus: newReactionConfig.swapStatus
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
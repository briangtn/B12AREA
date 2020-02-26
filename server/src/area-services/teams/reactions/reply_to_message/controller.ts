import {applyPlaceholders, OperationStatus, ReactionConfig, WorkableObject} from "../../../../services-interfaces";
import config from './config.json';
import {Context} from "@loopback/context";
import {AreaService} from "../../../../services";
import {TeamsHelper, TeamsReplyToMessageOptions, TeamsTokens} from "../../helper";
import {ReactionRepository, UserRepository} from "../../../../repositories";
import axios from "axios";
import {User} from "../../../../models";

interface RawReActionConfig {
    teamsId?: string;
    channelId?: string;
    messageId?: string;
    message?: string;
}

interface TriggerPreparedData {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    tokens: TeamsTokens;
}

export default class ReactionController {
    static async trigger(params: WorkableObject): Promise<void> {
        const reactionOptions: TeamsReplyToMessageOptions = params.reactionOptions as TeamsReplyToMessageOptions;
        const preparedData: TriggerPreparedData = params.reactionPreparedData as TriggerPreparedData;
        const teamsTeamId: string = applyPlaceholders(reactionOptions.teamsId, params.actionPlaceholders);
        const teamsChannelId: string = applyPlaceholders(reactionOptions.channelId, params.actionPlaceholders);
        const teamsMessageId: string = applyPlaceholders(reactionOptions.messageId, params.actionPlaceholders);
        const teamsMessage: string = applyPlaceholders(reactionOptions.message, params.actionPlaceholders);
        try {
            await axios.post(`https://graph.microsoft.com/beta/teams/${teamsTeamId}/channels/${teamsChannelId}/messages/${teamsMessageId}/replies`, {
                "body": {
                    "contentType": "html",
                    "content": teamsMessage
                }
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `${preparedData.tokens.token_type} ${preparedData.tokens.access_token}`
                }
            });
        } catch (e) {
            console.debug(`Failed to reply to message ${teamsTeamId}/${teamsChannelId}/${teamsMessageId}. Message: ${teamsMessage}`, e);
            return;
        }
    }

    static async prepareData(reactionId: string, ctx: Context): Promise<object> {
        let reactionRepository : ReactionRepository | undefined = undefined;
        let userRepository : UserRepository | undefined = undefined;
        try {
            reactionRepository = await ctx.get('repositories.ReactionRepository');
            userRepository = await ctx.get('repositories.UserRepository');
        } catch (e) {
            const error = { success: false, error: "Failed to resolve repositories", detail: e };
            throw error;
        }
        if (!reactionRepository || !userRepository) {
            const error = { success: false, error: "Failed to resolve repositories" };
            throw error;
        }
        const ownerId: string|null = await reactionRepository.getReactionOwnerID(reactionId);
        if (!ownerId) {
            const error = { success: false, error: "Failed to resolve reaction owner" };
            throw error;
        }
        try {
            const user: User = await userRepository.findById(ownerId);
            await TeamsHelper.refreshTokensForUser(user, ctx);
        } catch (e) {
            const error = { success: false, error: "Failed to refresh user tokens", detail: e };
            throw error;
        }
        const tokens: TeamsTokens = await userRepository.getServiceInformation(ownerId, 'teams') as TeamsTokens;
        return {
            tenantId: TeamsHelper.getTenantId(),
            clientId: TeamsHelper.getClientId(),
            clientSecret: TeamsHelper.getClientSecret(),
            tokens: tokens
        };
    }

    static async createReaction(userId: string, reactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        const castedConfig = reactionConfig as RawReActionConfig;
        let areaService : AreaService | undefined = undefined;
        try {
            areaService = await ctx.get('services.area');
        } catch (e) {
            return { success: false, error: "Failed to resolve services", details: e };
        }
        if (!areaService) {
            return { success: false, error: "Failed to resolve services" };
        }

        const configValidation = areaService.validateConfigSchema(castedConfig, config.configSchema);
        if (!configValidation.success)
            return configValidation;
        return {
            success: true,
            options: {
                teamsId: castedConfig.teamsId,
                channelId: castedConfig.channelId,
                messageId: castedConfig.messageId,
                message: castedConfig.message
            },
            data: {}
        }
    }

    static async updateReaction(reactionId: string, oldReactionConfig: Object, newReactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        const castedConfig = newReactionConfig as RawReActionConfig;
        let areaService : AreaService | undefined = undefined;
        try {
            areaService = await ctx.get('services.area');
        } catch (e) {
            return { success: false, error: "Failed to resolve services", details: e };
        }
        if (!areaService) {
            return { success: false, error: "Failed to resolve services" };
        }

        const configValidation = areaService.validateConfigSchema(castedConfig, config.configSchema);
        if (!configValidation.success)
            return configValidation;
        return {
            success: true,
            options: {
                teamsId: castedConfig.teamsId,
                channelId: castedConfig.channelId,
                messageId: castedConfig.messageId,
                message: castedConfig.message
            },
            data: {}
        }
    }

    static async deleteReaction(reactionId: string, reactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        return { success: true, options: reactionConfig };
    }

    static async getConfig(): Promise<ReactionConfig> {
        return config as ReactionConfig;
    }
}
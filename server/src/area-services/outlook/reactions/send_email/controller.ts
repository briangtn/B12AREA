import {applyPlaceholders, OperationStatus, ReactionConfig, WorkableObject} from "../../../../services-interfaces";
import config from './config.json';
import {Context} from "@loopback/context";
import {OutlookHelper, OutlookTokens, ServiceSendEmailData} from "../../helper";
import {AreaService} from "../../../../services";
import {ReactionRepository, UserRepository} from "../../../../repositories";
import {User} from "../../../../models";

interface SendEmailData {
    userId: string;
}

export default class ReactionController {
    static async trigger(params: WorkableObject): Promise<void> {
        const {tokens} = params.reactionPreparedData as {clientId: string; clientSecret: string; tokens: OutlookTokens};
        const sendEmailData: ServiceSendEmailData = params.reactionOptions as ServiceSendEmailData;
        sendEmailData.sendBody = applyPlaceholders(sendEmailData.sendBody, params.actionPlaceholders);
        sendEmailData.sendSubject = applyPlaceholders(sendEmailData.sendSubject, params.actionPlaceholders);
        sendEmailData.sendTo = applyPlaceholders(sendEmailData.sendTo, params.actionPlaceholders);
        if (sendEmailData.sendBcc)
            sendEmailData.sendBcc = applyPlaceholders(sendEmailData.sendBcc, params.actionPlaceholders);
        if (sendEmailData.sendCc)
            sendEmailData.sendCc = applyPlaceholders(sendEmailData.sendCc, params.actionPlaceholders);
        await OutlookHelper.sendEmail(sendEmailData, tokens);
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
            await OutlookHelper.refreshTokensForUser(user, ctx);
        } catch (e) {
            const error = { success: false, error: "Failed to refresh user tokens", detail: e };
            throw error;
        }
        const tokens: OutlookTokens = await userRepository.getServiceInformation(ownerId, 'outlook') as OutlookTokens;
        return {
            clientId: OutlookHelper.getClientId(),
            clientSecret: OutlookHelper.getClientSecret(),
            tokens: tokens
        };
    }

    static async validateConfig(reactionConfig: ServiceSendEmailData, ctx: Context): Promise<OperationStatus> {
        let areaService : AreaService | undefined = undefined;
        try {
            areaService = await ctx.get('services.area');
        } catch (e) {
            return { success: false, error: "Failed to resolve services", details: e };
        }
        if (!areaService) {
            return { success: false, error: "Failed to resolve services" };
        }

        const configValidation = areaService.validateConfigSchema(reactionConfig, config.configSchema);
        if (!configValidation.success)
            return configValidation;
        if (reactionConfig.sendBodyType) {
            const allowedTypes = ['text', 'html'];
            const isValid = allowedTypes.indexOf(reactionConfig.sendBodyType) !== -1;
            if (!isValid) {
                return { success: false, error: `Invalid sendBodyType, allowed values are ${allowedTypes.concat(',')}` };
            }
        }
        return {
            success: true,
            options: {
                sendTo: reactionConfig.sendTo,
                sendCc: reactionConfig.sendCc,
                sendBcc: reactionConfig.sendBcc,
                sendSubject: reactionConfig.sendSubject,
                sendBody: reactionConfig.sendBody,
                sendBodyType: reactionConfig.sendBodyType,
                sendSaveToSentItem: reactionConfig.sendSaveToSentItem
            }
        };
    }

    static async createReaction(userId: string, reactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        const parsedConfigStatus = await this.validateConfig(reactionConfig as ServiceSendEmailData, ctx);
        if (!parsedConfigStatus.success)
            return parsedConfigStatus;
        return {
            success: true,
            options: parsedConfigStatus.options,
            data: {
                userId
            }
        };
    }

    static async updateReaction(reactionId: string, oldReactionConfig: Object, newReactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        let reactionRepository : ReactionRepository | undefined = undefined;
        try {
            reactionRepository = await ctx.get('repositories.ReactionRepository');
        } catch (e) {
            return { success: false, error: "Failed to resolve repositories", details: e };
        }
        if (!reactionRepository) {
            return { success: false, error: "Failed to resolve repositories" };
        }
        const parsedConfigStatus = await this.validateConfig(newReactionConfig as ServiceSendEmailData, ctx);
        if (!parsedConfigStatus.success)
            return parsedConfigStatus;
        try {
            const userId = (await reactionRepository.getReactionOwnerID(reactionId))!;
            return {
                success: true,
                options: parsedConfigStatus.options,
                data: {
                    userId
                }
            };
        } catch (e) {
            return { success: false, error: "Failed to retrieve owner id", details: e };
        }
    }

    static async deleteReaction(reactionId: string, reactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        return { success: true, options: reactionConfig };
    }

    static async getConfig(): Promise<ReactionConfig> {
        return config as ReactionConfig;
    }
}
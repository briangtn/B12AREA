import {applyPlaceholders, OperationStatus, ReactionConfig, WorkableObject} from "../../../../services-interfaces";
import config from './config.json';
import {Context} from "@loopback/context";
import {GithubTokenRepository, ReactionRepository} from "../../../../repositories";
import {GithubToken, Reaction} from "../../../../models";

interface ForkReactionConfig {
    userId: string;
    owner: string;
    repo: string;
}

export default class ReactionController {

    static async trigger(params: WorkableObject): Promise<void> {
        console.log('github.R.fork', params); //todo
        const forkReactionConfig : ForkReactionConfig = params.reactionOptions as ForkReactionConfig;
        const owner = applyPlaceholders(forkReactionConfig.owner, params.actionPlaceholders);
        const repo = applyPlaceholders(forkReactionConfig.repo, params.actionPlaceholders);
        const githubToken = (params.reactionPreparedData as {githubToken:string}).githubToken;
    }

    static async prepareData(reactionId: string, ctx: Context): Promise<object> {
        let reactionRepository : ReactionRepository | undefined = undefined;
        let githubTokenRepository : GithubTokenRepository | undefined = undefined;
        try {
            reactionRepository = await ctx.get('repositories.ReactionRepository');
            githubTokenRepository = await ctx.get('repositories.GithubTokenRepository');
        } catch (e) {
            const error = { success: false, error: "Failed to resolve repositories", detail: e };
            throw error;
        }
        if (!reactionRepository || !githubTokenRepository) {
            const error = { success: false, error: "Failed to resolve repositories" };
            throw error;
        }
        const reaction: Reaction = await reactionRepository.findById(reactionId);
        const reactionConfig : ForkReactionConfig = reaction.options as ForkReactionConfig;
        let githubToken : GithubToken | null = null;
        try {
            githubToken = await githubTokenRepository.findOne({
                where: {
                    userId: reactionConfig.userId
                }
            }, {strictObjectIDCoercion: true});
        } catch (e) {
            const error = { success: false, error: "Failed to resolve github token", details: e };
            throw error;
        }
        if (!githubToken) {
            const error = { success: false, error: `Failed to resolve github token for user ${reactionConfig.userId}` };
            throw error;
        }
        return {
            githubToken: githubToken.token
        };
    }

    static async createReaction(userId: string, reactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        const forkReactionConfig : ForkReactionConfig = reactionConfig as ForkReactionConfig;
        if (!forkReactionConfig.owner) {
            return {success: false, error: "Missing owner in config"};
        }
        if (!forkReactionConfig.repo) {
            return {success: false, error: "Missing repo in config"};
        }
        return {
            success: true,
            options: {
                userId: userId,
                owner: forkReactionConfig.owner,
                repo: forkReactionConfig.repo
            }
        }
    }

    static async updateReaction(reactionId: string, oldReactionConfig: Object, newReactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        const newForkReactionConfig : ForkReactionConfig = newReactionConfig as ForkReactionConfig;
        if (!newForkReactionConfig.owner) {
            return {success: false, error: "Missing owner in config"};
        }
        if (!newForkReactionConfig.repo) {
            return {success: false, error: "Missing repo in config"};
        }
        const oldForkReactionConfig : ForkReactionConfig = oldReactionConfig as ForkReactionConfig;
        if (!oldForkReactionConfig.repo || !oldForkReactionConfig.owner || !oldForkReactionConfig.userId) {
            return {success: false, error: "Error with stored config please contact area help team."};
        }
        return {
            success: true,
            options: {
                userId: oldForkReactionConfig.userId,
                owner: newForkReactionConfig.owner,
                repo: newForkReactionConfig.repo
            }
        }
    }

    static async deleteReaction(reactionId: string, reactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        return {
            success: true,
            options: reactionConfig
        }
    }

    static getConfig(): ReactionConfig {
        return config as ReactionConfig;
    }
}
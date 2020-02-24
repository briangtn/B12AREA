import {applyPlaceholders, OperationStatus, ReactionConfig, WorkableObject} from "../../../../services-interfaces";
import config from './config.json';
import axios from 'axios';
import {Context} from "@loopback/context";
import {ReactionRepository, UserRepository} from "../../../../repositories";
import {Reaction} from "../../../../models";
import {GithubTokenModel} from "../../interfaces";

const GITHUB_API_BASE_URL = 'https://api.github.com';

interface ForkReactionConfig {
    userId: string;
    owner: string;
    repo: string;
}

export default class ReactionController {

    static async trigger(params: WorkableObject): Promise<void> {
        const forkReactionConfig : ForkReactionConfig = params.reactionOptions as ForkReactionConfig;
        const owner = applyPlaceholders(forkReactionConfig.owner, params.actionPlaceholders);
        const repo = applyPlaceholders(forkReactionConfig.repo, params.actionPlaceholders);
        const githubToken = (params.reactionPreparedData as {githubToken:string}).githubToken;
        try {
            await axios.post(`${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/forks`, {}, {
                headers: {
                    Authorization: `token ${githubToken}`
                }
            });
        } catch (e) {
            console.debug(`Failed to fork repository ${owner} ${repo}`, e);
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
        const reaction: Reaction = await reactionRepository.findById(reactionId);
        const reactionConfig : ForkReactionConfig = reaction.options as ForkReactionConfig;
        let githubToken : GithubTokenModel | null = null;
        try {
            githubToken = await userRepository.getServiceInformation(reactionConfig.userId, 'github') as GithubTokenModel;
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
            },
            data: {}
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
            },
            data: {}
        }
    }

    static async deleteReaction(reactionId: string, reactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        return {
            success: true,
            options: reactionConfig,
            data: {}
        }
    }

    static async getConfig(): Promise<ReactionConfig> {
        return config as ReactionConfig;
    }
}
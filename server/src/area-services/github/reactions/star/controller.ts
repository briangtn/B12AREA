import {applyPlaceholders, OperationStatus, ReactionConfig, WorkableObject} from "../../../../services-interfaces";
import config from './config.json';
import {Context} from "@loopback/context";
import {ReactionRepository, UserRepository} from "../../../../repositories";
import {Reaction} from "../../../../models";
import axios from "axios";
import {GithubTokenModel} from "../../interfaces";

const GITHUB_API_BASE_URL = 'https://api.github.com';

interface StarReactionConfig {
    userId: string;
    owner: string;
    repo: string;
}

export default class ReactionController {
    static async trigger(params: WorkableObject): Promise<void> {
        const starReactionConfig : StarReactionConfig = params.reactionOptions as StarReactionConfig;
        const owner = applyPlaceholders(starReactionConfig.owner, params.actionPlaceholders);
        const repo = applyPlaceholders(starReactionConfig.repo, params.actionPlaceholders);
        const githubToken = (params.reactionPreparedData as {githubToken:string}).githubToken;
        try {
            await axios.put(`${GITHUB_API_BASE_URL}/user/starred/${owner}/${repo}`, {}, {
                headers: {
                    'Content-Length': '0',
                    Authorization: `token ${githubToken}`
                }
            });
        } catch (e) {
            console.debug(`Failed to star repository ${owner} ${repo}`, e);
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
        const reactionConfig : StarReactionConfig = reaction.options as StarReactionConfig;
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
        const starActionConfig : StarReactionConfig = reactionConfig as StarReactionConfig;
        if (!starActionConfig.owner) {
            return {success: false, error: "Missing owner in config"};
        }
        if (!starActionConfig.repo) {
            return {success: false, error: "Missing repo in config"};
        }
        return {
            success: true,
            options: {
                userId: userId,
                owner: starActionConfig.owner,
                repo: starActionConfig.repo
            },
            data: {}
        }
    }

    static async updateReaction(reactionId: string, oldReactionConfig: Object, newReactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        const newStarActionConfig : StarReactionConfig = newReactionConfig as StarReactionConfig;
        if (!newStarActionConfig.owner) {
            return {success: false, error: "Missing owner in config"};
        }
        if (!newStarActionConfig.repo) {
            return {success: false, error: "Missing repo in config"};
        }
        const oldStarActionConfig : StarReactionConfig = oldReactionConfig as StarReactionConfig;
        if (!oldStarActionConfig.repo || !oldStarActionConfig.owner || !oldStarActionConfig.userId) {
            return {success: false, error: "Error with stored config please contact area help team."};
        }
        return {
            success: true,
            options: {
                userId: oldStarActionConfig.userId,
                owner: newStarActionConfig.owner,
                repo: newStarActionConfig.repo
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
import {param, post, requestBody} from "@loopback/rest";
import {ActionConfig, ActionFunction, OperationStatus} from '../../../../services-interfaces'
import config from './config.json';
import axios from 'axios';
import {Context, inject} from "@loopback/context";
import {
    ActionRepository,
    GithubTokenRepository,
    GithubWebhookRepository,
    UserRepository
} from "../../../../repositories";
import {Action, GithubToken, GithubWebhook} from "../../../../models";
import {repository} from "@loopback/repository";
import {RandomGeneratorManager} from "../../../../services";
import {GithubPushHookBody, GithubWebhookResponse} from "../../interfaces";

const API_URL : string = process.env.API_URL ?? "http://localhost:8080";

interface PushActionConfig {
    owner: string;
    repo: string;
    webhookId: string;
    hookUuid: string;
    userId: string;
}

export default class ActionController {

    constructor(
        @inject.context() private ctx: Context,
        @repository(UserRepository) public userRepository: UserRepository,
        @repository(ActionRepository) public actionRepository: ActionRepository,
        @repository(GithubTokenRepository) public githubTokenRepository: GithubTokenRepository,
        @repository(GithubWebhookRepository) public githubWebhookRepository: GithubWebhookRepository
    ) {}

    @post('/webhook/{webhookId}')
    async webhook(
        @param.path.string('webhookId') webhookId: string,
        @requestBody() body : GithubPushHookBody
    ) {
        if (body.zen !== undefined) {
            // this is the initial hook we simply ignore it
            return;
        }
        let webhook : GithubWebhook | null = null;
        try {
            webhook = await this.githubWebhookRepository.findOne({
                where: {
                    hookUuid: webhookId
                }
            });
        } catch (e) {
            return { error: `Failed to process event: webhook ${webhookId}`, details: e };
        }
        if (!webhook) {
            return { error: `Failed to process event: webhook ${webhookId} : webhook not found in database` };
        }
        let action : Action | null = null;
        try {
            action = await this.actionRepository.findOne({
                where: {
                    serviceAction: 'github.A.push',
                    options: {
                        webhookId: webhook.id
                    }
                }
            }, {strictObjectIDCoercion: true});
        } catch (e) {
            return { error: `Failed to process event: webhook ${webhookId}`, details: e };
        }
        if (!action) {
            return { error: `Failed to process event: webhook ${webhookId} : action not found in database` };
        }
        return ActionFunction({
            actionId: action.id!,
            placeholders: [
                {
                    name: "GitRef",
                    value: body.ref
                },
                {
                    name: "GitHead",
                    value: body.head
                },
                {
                    name: "GitBefore",
                    value: body.before
                },
                {
                    name: "GitNbCommit",
                    value: body.size.toString()
                },
                {
                    name: "GitLastCommitMessage",
                    value: body.commits[0].message
                },
                {
                    name: "GitLastCommitAuthorName",
                    value: body.commits[0].author.name
                },
                {
                    name: "GitLastCommitAuthorEmail",
                    value: body.commits[0].author.email
                }
            ]
        }, this.ctx);
    }

    static async createAction(userId: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        let githubTokenRepository : GithubTokenRepository | undefined = undefined;
        let githubWebhookRepository : GithubWebhookRepository | undefined = undefined;
        let randomGeneratorService: RandomGeneratorManager | undefined = undefined;
        try {
            githubTokenRepository = await ctx.get('repositories.GithubTokenRepository');
            githubWebhookRepository = await ctx.get('repositories.GithubWebhookRepository');
            randomGeneratorService = await ctx.get('services.randomGenerator');
        } catch (e) {
            return { success: false, error: "Could not resolve repositories in given context", details: e };
        }
        if (!githubWebhookRepository || !githubTokenRepository || !randomGeneratorService)
            return { success: false, error: "Could not resolve repositories in given context" };

        const pushActionConfig : PushActionConfig = actionConfig as PushActionConfig;
        if (pushActionConfig.owner === undefined || pushActionConfig.repo === undefined)
            return { success: false, error: "Could not find owner or repo in action config" };

        let githubToken : GithubToken | null = null;
        try {
            githubToken = await githubTokenRepository.findOne({
                where: {
                    userId: userId
                }
            }, {strictObjectIDCoercion: true});
        } catch (e) {
            return { success: false, error: "Could not find github token for given user: user not found or not logged to github" };
        }
        if (!githubToken)
            return { success: false, error: "Could not find github token for given user: user not found or not logged to github" };

        let generatedUUID = '';
        let generated = false;
        while (!generated) {
            generatedUUID = randomGeneratorService.generateRandomString(16);
            try {
                const hook : GithubWebhook | null = await githubWebhookRepository.findOne({
                    where: {
                        hookUuid: generatedUUID
                    }
                });
                if (hook === null)
                    generated = true;
            } catch (e) {
                generated = false;
            }
        }

        try {
            const response : { data: GithubWebhookResponse } = await axios.post('https://api.github.com/repos/' + pushActionConfig.owner + '/' + pushActionConfig.repo + '/hooks', {
                name: 'web',
                config: {
                    url: `${API_URL}/services/github/actions/push/webhook/${generatedUUID}`,
                    // required by github
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    content_type: 'json',
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    insecure_ssl: '0'
                },
                events: [ "push" ],
                active: true
            }, {
                headers: {
                    Authorization: `token ${githubToken.token}`
                }
            });
            try {
                const githubWebhook = await githubWebhookRepository.create({
                    hookUuid: generatedUUID,
                    userId: userId,
                    owner: pushActionConfig.owner,
                    repo: pushActionConfig.repo,
                    type: response.data.type,
                    githubId: response.data.id,
                    name: response.data.name,
                    active: response.data.active,
                    events: response.data.events,
                    config: response.data.config,
                    updatedAt: response.data.updated_at,
                    createdAt: response.data.created_at,
                    url: response.data.url,
                    testUrl: response.data.test_url,
                    pingUrl: response.data.ping_url,
                    lastResponse: response.data.last_response
                });
                return {
                    success: true,
                    options: {
                        webhookId: githubWebhook.id,
                        hookUuid: generatedUUID,
                        userId: userId,
                        owner: pushActionConfig.owner,
                        repo: pushActionConfig.repo
                    }
                }
            } catch (e) {
                return { success: false, error: `Error while inserting webhook in database! You need to manually delete webhook id ${response.data.id} in github` };
            }
        } catch (e) {
            if (e.response && e.response.data)
                return { success: false, error: 'Error when contacting github api', details: { config: e.config, data: e.response.data } };
            else
                return { success: false, error: 'Error when contacting github api', details: { config: e.config, data: {} } };
        }
    }

    static async updateAction(actionId: string, oldActionConfig: Object, newActionConfig: Object, ctx: Context): Promise<OperationStatus> {
        const oldPushActionConfig : PushActionConfig = oldActionConfig as PushActionConfig;
        if (oldPushActionConfig.owner === undefined ||
            oldPushActionConfig.repo === undefined ||
            oldPushActionConfig.webhookId === undefined ||
            oldPushActionConfig.userId === undefined ||
            oldPushActionConfig.hookUuid === undefined) {
            return { success: false, error: "Invalid oldActionConfig" };
        }
        const newPushActionConfig : PushActionConfig = newActionConfig as PushActionConfig;
        if (newPushActionConfig.owner === undefined || newPushActionConfig.repo === undefined) {
            return { success: false, error: "Invalid newPushActionConfig" };
        }
        if (oldPushActionConfig.owner === newPushActionConfig.owner && oldPushActionConfig.repo === newPushActionConfig.repo) {
            return { success: true, options: oldPushActionConfig };
        }
        try {
            const status = await this.deleteAction(actionId, oldPushActionConfig, ctx);
            if (!status.success) {
                return status;
            }
        } catch (e) {
            return { success: false, error: "Failed to remove old webhook", details: e };
        }
        return this.createAction(oldPushActionConfig.userId, newActionConfig, ctx);
    }

    static async deleteAction(actionId: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        let githubTokenRepository : GithubTokenRepository | undefined = undefined;
        let githubWebhookRepository : GithubWebhookRepository | undefined = undefined;
        try {
            githubTokenRepository = await ctx.get('repositories.GithubTokenRepository');
            githubWebhookRepository = await ctx.get('repositories.GithubWebhookRepository');
        } catch (e) {
            return { success: false, error: "Could not resolve repositories in given context", details: e };
        }
        if (!githubWebhookRepository || !githubTokenRepository)
            return { success: false, error: "Could not resolve repositories in given context" };
        const pushActionConfig : PushActionConfig = actionConfig as PushActionConfig;
        if (pushActionConfig.owner === undefined ||
            pushActionConfig.repo === undefined ||
            pushActionConfig.webhookId === undefined ||
            pushActionConfig.userId === undefined ||
            pushActionConfig.hookUuid === undefined) {
            return { success: false, error: "Invalid actionConfig" };
        }
        let webhook : GithubWebhook | null = null;
        try {
            webhook = await githubWebhookRepository.findOne({
                where: {
                    id: pushActionConfig.webhookId
                }
            }, {strictObjectIDCoercion: true});
        } catch (e) {
            return { success: false, error: "Failed to retrieve webhook", details: e };
        }
        if (!webhook)
            return { success: false, error: "Failed to retrieve webhook" };

        let githubToken : GithubToken | null = null;
        try {
            githubToken = await githubTokenRepository.findOne({
                where: {
                    userId: pushActionConfig.userId
                }
            }, {strictObjectIDCoercion: true});
        } catch (e) {
            return { success: false, error: "Could not find github token for given user: user not found or not logged to github" };
        }
        if (!githubToken)
            return { success: false, error: "Could not find github token for given user: user not found or not logged to github" };

        try {
            await axios.delete(
                `https://api.github.com/repos/${pushActionConfig.owner}/${pushActionConfig.repo}/hooks/${webhook.githubId}`,
                {
                    headers: {
                        Authorization: `token ${githubToken.token}`
                    }
                }
            );
            try {
                await githubWebhookRepository.deleteById(webhook.id);
            } catch (e) {
                return { success: false, error: "Failed to delete webhook from database", details: e };
            }
        } catch (e) {
            if (e.response && e.response.data)
                return { success: false, error: 'Error when contacting github api', details: { config: e.config, data: e.response.data } };
            else
                return { success: false, error: 'Error when contacting github api', details: { config: e.config, data: {} } };
        }
        return { success: true, options: pushActionConfig }
    }

    static getConfig(): ActionConfig {
        return config as ActionConfig;
    }
}
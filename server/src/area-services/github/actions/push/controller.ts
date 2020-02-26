import {param, post, requestBody} from "@loopback/rest";
import {ActionConfig, ActionFunction, OperationStatus} from '../../../../services-interfaces'
import config from './config.json';
import axios from 'axios';
import {Context, inject} from "@loopback/context";
import {
    ActionRepository,
    UserRepository
} from "../../../../repositories";
import {Action} from "../../../../models";
import {repository} from "@loopback/repository";
import {AreaService, RandomGeneratorManager} from "../../../../services";
import {GithubPushHookBody, GithubTokenModel, GithubWebhookModel, GithubWebhookResponse} from "../../interfaces";
import {service} from "@loopback/core";

const API_URL : string = process.env.API_URL ?? "http://localhost:8080";

interface PushActionConfig {
    owner: string;
    repo: string;
    hookUuid: string;
    userId: string;
}

export default class ActionController {

    constructor(
        @inject.context() private ctx: Context,
        @repository(UserRepository) public userRepository: UserRepository,
        @repository(ActionRepository) public actionRepository: ActionRepository,
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
        let action : Action | null = null;
        try {
            action = await this.actionRepository.findOne({
                where: {
                    and: [
                        {
                            serviceAction: 'github.A.push'
                        },
                        {
                            "data.hookUuid": webhookId
                        }
                    ]
                }
            }, {strictObjectIDCoercion: true});
        } catch (e) {
            return { error: `Failed to process event: webhook ${webhookId}`, details: e };
        }
        if (!action) {
            return { error: `Failed to process event: webhook ${webhookId} : action not found in database` };
        }
        const actionOptions = await this.actionRepository.getActionSettings(action.id!) as {owner: string, repo: string};
        return ActionFunction({
            actionId: action.id!,
            placeholders: [
                {
                    name: "GitRef",
                    value: body.ref
                },
                {
                    name: "GitHead",
                    value: body.after
                },
                {
                    name: "GitBefore",
                    value: body.before
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
                },
                {
                    name: "GitRepositoryOwner",
                    value: actionOptions.owner
                },
                {
                    name: "GitRepositoryName",
                    value: actionOptions.repo
                }
            ]
        }, this.ctx);
    }

    static async createAction(userId: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        let randomGeneratorService: RandomGeneratorManager | undefined = undefined;
        let userRepository: UserRepository | undefined = undefined;
        let actionRepository: ActionRepository | undefined = undefined;
        try {
            userRepository = await ctx.get('repositories.UserRepository');
            actionRepository = await ctx.get('repositories.ActionRepository');
            randomGeneratorService = await ctx.get('services.randomGenerator');
        } catch (e) {
            return { success: false, error: "Could not resolve repositories in given context", details: e };
        }
        if (!randomGeneratorService || !userRepository || !actionRepository)
            return { success: false, error: "Could not resolve repositories in given context" };

        const pushActionConfig : PushActionConfig = actionConfig as PushActionConfig;
        if (pushActionConfig.owner === undefined || pushActionConfig.repo === undefined)
            return { success: false, error: "Could not find owner or repo in action config" };

        let githubToken : GithubTokenModel | null = null;
        try {
            githubToken = await userRepository.getServiceInformation(userId, 'github') as GithubTokenModel;
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
                const hook : GithubWebhookModel | null = await actionRepository.findOne({
                    where: {
                        and: [
                            {
                                serviceAction: 'github.A.push'
                            },
                            {
                                "data.hookUuid": generatedUUID
                            }
                        ]
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
            return {
                success: true,
                options: {
                    hookUuid: generatedUUID,
                    userId: userId,
                    owner: pushActionConfig.owner,
                    repo: pushActionConfig.repo
                },
                data: {
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
                }
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
        let actionRepository : ActionRepository | undefined = undefined;
        let userRepository : UserRepository | undefined = undefined;
        try {
            actionRepository = await ctx.get('repositories.ActionRepository');
            userRepository = await ctx.get('repositories.UserRepository');
        } catch (e) {
            return { success: false, error: "Could not resolve repositories in given context", details: e };
        }
        if (!actionRepository || !userRepository)
            return { success: false, error: "Could not resolve repositories in given context" };
        const pushActionConfig : PushActionConfig = actionConfig as PushActionConfig;
        if (pushActionConfig.owner === undefined ||
            pushActionConfig.repo === undefined ||
            pushActionConfig.userId === undefined ||
            pushActionConfig.hookUuid === undefined) {
            return { success: false, error: "Invalid actionConfig" };
        }
        let webhook : GithubWebhookModel | null = null;
        try {
            const action = await actionRepository.findOne({
                where: {
                    and: [
                        {
                            serviceAction: 'github.A.push'
                        },
                        {
                            "data.hookUuid": pushActionConfig.hookUuid
                        }
                    ]
                }
            });
            webhook = action?.data as GithubWebhookModel;
        } catch (e) {
            return { success: false, error: "Failed to retrieve webhook", details: e };
        }
        if (!webhook)
            return { success: false, error: "Failed to retrieve webhook" };

        let githubToken : GithubTokenModel | null = null;
        try {
            githubToken = await userRepository.getServiceInformation(pushActionConfig.userId, 'github') as GithubTokenModel;
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
        } catch (e) {
            if (e.response && e.response.data)
                return { success: false, error: 'Error when contacting github api', details: { config: e.config, data: e.response.data } };
            else
                return { success: false, error: 'Error when contacting github api', details: { config: e.config, data: {} } };
        }
        return { success: true, options: pushActionConfig, data: webhook };
    }

    static async getConfig(): Promise<ActionConfig> {
        return config as ActionConfig;
    }
}
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

interface PushActionConfig {
    owner: string;
    repo: string;
}

interface GithubWebhookResponse {
    type: string;
    id: number;
    name: string;
    active: boolean;
    events: string[];
    config: object;
    updated_at: string;
    created_at: string;
    url: string;
    test_url: string;
    ping_url: string;
    last_response: object;
}

interface GithubCommitBody {
    sha: string;
    message: string;
    author: {
        name: string;
        email: string;
    }
    url: string;
    distinct: boolean;
}

interface GithubPushHookBody {
    zen: string;
    ref: string;
    head: string;
    before: string;
    size: number;
    distinct_size: number;
    commits: GithubCommitBody[];
}

export default class ActionController {

    constructor(
        @inject.context() private ctx: Context,
        @repository(UserRepository) public userRepository: UserRepository,
        @repository(ActionRepository) public actionRepository: ActionRepository,
        @repository(GithubTokenRepository) public githubTokenRepository: GithubTokenRepository,
        @repository(GithubWebhookRepository) public githubWebhookRepository: GithubWebhookRepository
    ) {}

    @post('/test/create')
    async createHook() {
        return ActionController.createAction('5e42bec9d7e37937ee25ffc6', {owner: 'Eldriann', repo: 'JFECS'}, this.ctx);
    }

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
            return { success: false, error: "Cound not resolve repositories in given context", options: undefined, details: e };
        }
        if (!githubWebhookRepository || !githubTokenRepository || !randomGeneratorService)
            return { success: false, error: "Cound not resolve repositories in given context", options: undefined };

        const pushActionConfig : PushActionConfig = actionConfig as PushActionConfig;
        if (pushActionConfig.owner === undefined || pushActionConfig.repo === undefined)
            return { success: false, error: "Cound not find owner or repo in action config", options: undefined };

        let githubToken : GithubToken | null = null;
        try {
            githubToken = await githubTokenRepository.findOne({
                where: {
                    userId: userId
                }
            }, {strictObjectIDCoercion: true});
        } catch (e) {
            return { success: false, error: "Cound not find github token for given user: user not found or not logged to github", options: undefined };
        }
        if (!githubToken)
            return { success: false, error: "Cound not find github token for given user: user not found or not logged to github", options: undefined };

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
                    url: `${process.env.API_URL}/services/github/actions/push/webhook/${generatedUUID}`,
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
                return { success: false, error: `Error while inserting webhook in database! You need to manually delete webhook id ${response.data.id} in github`, options: undefined };
            }
        } catch (e) {
            return { success: false, error: 'Error when contacting github api', options: undefined, details: { config: e.config, data: e.response.data } };
        }
    }

    static async updateAction(actionId: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        //todo
        const pushActionConfig : PushActionConfig = actionConfig as PushActionConfig;
        if (pushActionConfig.owner === undefined || pushActionConfig.repo === undefined) {
            return {
                success: false,
                error: "Cound not find owner or repo in action config",
                options: undefined
            };
        }
        return {
            success: true,
            error: undefined,
            options: {}
        }
    }

    static async deleteAction(actionId: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        //todo
        const pushActionConfig : PushActionConfig = actionConfig as PushActionConfig;
        if (pushActionConfig.owner === undefined || pushActionConfig.repo === undefined) {
            return {
                success: false,
                error: "Cound not find owner or repo in action config",
                options: undefined
            };
        }
        return {
            success: true,
            error: undefined,
            options: {}
        }
    }

    static getConfig(): ActionConfig {
        return config as ActionConfig;
    }
}
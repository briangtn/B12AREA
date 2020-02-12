import {post, RequestBody, requestBody} from "@loopback/rest";
import {ActionConfig, ActionFunction, OperationStatus} from '../../../../services-interfaces'
import config from './config.json';
import axios from 'axios';
import {Context, inject} from "@loopback/context";
import {GithubTokenRepository, GithubWebhookRepository} from "../../../../repositories";
import {GithubToken} from "../../../../models";

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
    ref: string;
    head: string;
    before: string;
    size: number;
    distinct_size: number;
    commits: GithubCommitBody[];
}

export default class ActionController {

    constructor(@inject.context() private ctx: Context) {}

    @post('/webhook')
    async webhook(@requestBody() body : GithubPushHookBody) {
        //todo
        console.log(body);
        /*await ActionFunction({
            actionId: "TODO",//todo
            placeholders: [{
                name: "toReplace",
                value: "Replacement value"
            }]
        }, this.ctx);*/
    }

    static async createAction(userId: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        let githubTokenRepository : GithubTokenRepository | undefined = undefined;
        let githubWebhookRepository : GithubWebhookRepository | undefined = undefined;
        try {
            githubTokenRepository = await ctx.get('repositories.GithubTokenRepository');
            githubWebhookRepository = await ctx.get('repositories.GithubWebhookRepository');
        } catch (e) {
            return { success: false, error: "Cound not resolve repositories in given context", options: undefined, details: e };
        }
        if (!githubWebhookRepository || !githubTokenRepository)
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

        try {
            const response : { data: GithubWebhookResponse } = await axios.post('https://api.github.com/repos/' + pushActionConfig.owner + '/' + pushActionConfig.repo + '/hooks', {
                name: 'web',
                config: {
                    url: `${process.env.API_URL}/services/github/actions/push/webhook`,
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
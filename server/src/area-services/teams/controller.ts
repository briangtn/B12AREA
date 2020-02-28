import config from './config.json';
import {Context, inject} from "@loopback/context";
import {LoginObject, ServiceConfig} from "../../services-interfaces";
import {ExchangeCodeGeneratorManager} from "../../services";
import {get, param, Response, RestBindings} from "@loopback/rest";
import {TeamsHelper, TeamsTokens} from "./helper";
import {ActionRepository, UserRepository} from "../../repositories";
import {User} from "../../models";
import {UserProfile} from "@loopback/security";
import {HttpErrors} from "@loopback/rest/dist";
import {repository} from "@loopback/repository";

export default class ServiceController {

    constructor(
        @inject('services.exchangeCodeGenerator') protected exchangeCodeGenerator: ExchangeCodeGeneratorManager,
        @inject(RestBindings.Http.RESPONSE) public response: Response,
        @repository(UserRepository) public userRepository: UserRepository
    ) {}

    static async start(ctx: Context): Promise<void> {
        console.log('Starting teams service');
        const actionRepository: ActionRepository = await ctx.get('repositories.ActionRepository');

        // Start pulling's for new messages in channels
        const newMessagesInChannelActions = await actionRepository.find({where: {serviceAction: 'teams.A.new_message_in_channel'}});

        for (const action of newMessagesInChannelActions) {
            const ownerId  = await actionRepository.getActionOwnerID(action.id?.toString()!);
            if (!ownerId)
                continue;
            await TeamsHelper.startNewMessageInChannelPulling(action.id!, ownerId, ctx);
        }
        // Start pulling's for new reacts on messages
        const newReactsOnMessageActions = await actionRepository.find({where: {serviceAction: 'teams.A.new_react_on_message'}});

        for (const action of newReactsOnMessageActions) {
            const ownerId  = await actionRepository.getActionOwnerID(action.id?.toString()!);
            if (!ownerId)
                continue;
            await TeamsHelper.startNewReactOnMessagePulling(action.id!, ownerId, ctx);
        }
    }

    static async login(params: LoginObject): Promise<string> {
        const userRepository: UserRepository = await params.ctx.get('repositories.UserRepository');
        const exchangeCodeGenerator: ExchangeCodeGeneratorManager = await params.ctx.get('services.exchangeCodeGenerator');

        const user : User = (await userRepository.findOne({where: {email: params.user.email}}))!;

        if (user.services && user.services["teams" as keyof typeof user.services]) {
            try {
                await TeamsHelper.refreshTokensForUser(user, params.ctx);
                // eslint-disable-next-line no-empty
            } catch (e) {}
        }

        if (await userRepository.getServiceInformation(user.id, 'teams')) {
            const codeParam = await exchangeCodeGenerator.generate({status: 'Authenticated with teams'}, true);
            return params.redirectUrl + '?code=' + codeParam;
        }

        const baseRedirectUrl = TeamsHelper.generateLoginRedirectUrlWithoutState();
        const state = await exchangeCodeGenerator.generate({url: params.redirectUrl, user: params.user}, false);
        return `${baseRedirectUrl}&state=${state}`;
    }

    @get('/oauth', {
        responses: {
            '200': {
                description: 'OAuth received'
            }
        }
    })
    async oauth(@param.query.string('code') code?: string,
                @param.query.string('state') state?: string,
                @param.query.string('error') error?: string
    ): Promise<void> {
        if (!state) {
            console.error('error state not found', code);
            return;
        }
        const stateData = await this.exchangeCodeGenerator.getData(state, false, true) as {url: string; user: UserProfile};
        if (!stateData)
            throw new HttpErrors.UnprocessableEntity('State is invalid. Man in the middle?');
        if (error) {
            const codeParam = await this.exchangeCodeGenerator.generate({error: 'Failed to login to teams', info: {error}}, true);
            return this.response.redirect(stateData.url + '?code=' + codeParam);
        }
        if (!code) {
            console.error('error code not found', state);
            return;
        }

        const user: User|null = (await this.userRepository.findOne({
            where: {
                email: stateData.user.email
            }
        }));
        if (user == null) {
            const codeParam = await this.exchangeCodeGenerator.generate({error: 'User not found', info: {cause: 'database could probably not be reached'}}, true);
            return this.response.redirect(stateData.url + '?code=' + codeParam);
        }

        try {
            const tokens: TeamsTokens = await TeamsHelper.exchangeCodeForTokens(code);
            try {
                await this.userRepository.addService(user.id, tokens, 'teams');
            } catch (e) {
                const codeParam = await this.exchangeCodeGenerator.generate({error: 'Failed to store teams token', info: e}, true);
                return this.response.redirect(stateData.url + '?code=' + codeParam);
            }
            const codeParam = await this.exchangeCodeGenerator.generate({status: 'Authenticated with teams'}, true);
            return this.response.redirect(stateData.url + '?code=' + codeParam);
        } catch (e) {
            const codeParam = await this.exchangeCodeGenerator.generate(e, true);
            return this.response.redirect(stateData.url + '?code=' + codeParam);
        }
    }

    static async getConfig(): Promise<ServiceConfig> {
        return config;
    }
}
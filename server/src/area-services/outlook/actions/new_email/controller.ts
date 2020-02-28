import {param, post, requestBody, Response, RestBindings} from "@loopback/rest";
import {ActionConfig, OperationStatus} from '../../../../services-interfaces'
import config from './config.json';
import {Context, inject} from "@loopback/context";
import {AreaService} from "../../../../services";
import {ActionRepository, UserRepository} from "../../../../repositories";
import {service} from "@loopback/core";
import {repository} from "@loopback/repository";
import {Action} from "../../../../models";
import {OutlookException, OutlookHelper, OutlookNewEmailOptions, OutlookTokens} from "../../helper";
import {OutlookSubscriptionResource} from "../../outlookApiResources";

const API_URL : string = process.env.API_URL ?? "http://localhost:8080";

interface RawNewEmailNotification {
    value: {
        subscriptionId: string;
        subscriptionExpirationDateTime: string;
        clientState: string;
        changeType: string;
        resource: string;
        tenantId: string;
        resourceData: {
            id: string;
        }
    }[]
}

export default class ActionController {

    constructor(
        @inject.context() private ctx: Context,
        @inject(RestBindings.Http.RESPONSE) public response: Response,
        @service(AreaService) private areaService: AreaService,
        @repository(UserRepository) private userRepository: UserRepository,
        @repository(ActionRepository) private actionRepository: ActionRepository
    ) {}

    @post('/webhook/new_email')
    async webhook(
        @requestBody() body : RawNewEmailNotification,
        @param.path.string('validationToken') validationToken?: string
    ) {
        if (validationToken) {
            this.response.set('Content-type', 'text/plain');
            this.response.status(200).send(validationToken);
            return;
        }
        this.response.status(202).send();
        for (const newEmail of body.value) {
            const action: Action|null = await this.actionRepository.findOne({
                where: {
                    and: [
                        {
                            serviceAction: 'outlook.A.new_email'
                        },
                        {
                            "data.id": newEmail.subscriptionId
                        }
                    ]
                }
            });
            if (!action)
                continue;
            OutlookHelper.processSubscription(action.id!, action.data! as OutlookSubscriptionResource, newEmail.resource, this.ctx)
                .catch((e: OutlookException) => {console.error(`Failed to process outlook email: ${e.error}`, e.info)});
        }
    }

    static async createAction(userId: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        const castedActionConfig: OutlookNewEmailOptions = actionConfig as OutlookNewEmailOptions;
        let areaService : AreaService | undefined = undefined;
        try {
            areaService = await ctx.get('services.area');
        } catch (e) {
            return { success: false, error: "Failed to resolve services", details: e };
        }
        if (!areaService) {
            return { success: false, error: "Failed to resolve services" };
        }

        const configValidation = areaService.validateConfigSchema(castedActionConfig, config.configSchema);
        if (!configValidation.success)
            return configValidation;

        let tokens: OutlookTokens;
        try {
            tokens = await OutlookHelper.getTokensForUserId(userId, ctx);
        } catch (e) {
            return { success: false, error: 'Failed to refresh outlook tokens', details: e };
        }

        let subscription: OutlookSubscriptionResource;
        try {
            subscription = await OutlookHelper.registerNewMessageReceivedSubscription(`${API_URL}/services/outlook/webhook/new_email`, tokens);
        } catch (e) {
            return { success: false, error: 'Failed to create subscription', details: e };
        }

        return {
            success: true,
            options: {
                onlySender: castedActionConfig.onlySender,
                onlyObjectMatch: castedActionConfig.onlyObjectMatch,
                onlyBodyMatch: castedActionConfig.onlyBodyMatch
            },
            data: subscription
        };
    }

    static async createActionFinished(actionID: string, userID: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        let actionRepository : ActionRepository | undefined = undefined;
        try {
            actionRepository = await ctx.get('repositories.ActionRepository');
        } catch (e) {
            return { success: false, error: "Failed to resolve repositories", details: e };
        }
        if (!actionRepository) {
            return { success: false, error: "Failed to resolve repositories" };
        }
        try {
            const subscription: OutlookSubscriptionResource = (await actionRepository.getActionData(actionID))! as OutlookSubscriptionResource;
            OutlookHelper.startSubscriptionRefreshTimeout(subscription, ctx);
        } catch (e) {
            return { success: false, error: "An error occurred", details: e };
        }
        return {success: true}
    }

    static async updateAction(actionId: string, oldActionConfig: Object, newActionConfig: Object, ctx: Context): Promise<OperationStatus> {
        // If successful
        //todo stop refresh to
        return { success: true, options: { thisShouldContains: "data to be stored" } };
        // If an error occurs
        // return { success: false, error: 'Error returned to front end', details: { backEndDebugDetails: "this is just an example details it is not required" } };
    }

    static async updateActionFinished(actionID: string, userID: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        //todo start refresh to => probably need to stop recreating it if expires or fail
        return {success: true}
    }

    static async deleteAction(actionId: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
        // If successful
        return { success: true, options: { thisShouldContains: "data to be stored" } };
        // If an error occurs
        // return { success: false, error: 'Error returned to front end', details: { backEndDebugDetails: "this is just an example details it is not required" } };
    }

    static async getConfig(): Promise<ActionConfig> {
        return config as ActionConfig;
    }
}
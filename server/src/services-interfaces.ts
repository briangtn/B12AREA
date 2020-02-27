import Queue from "bull";
import {Context} from "@loopback/context";
import {UserProfile} from "@loopback/security";
import {ActionRepository, AreaRepository, ReactionRepository, UserRepository} from "./repositories";
import {Action, Area, User} from "./models";

export interface TriggerObject {
    actionId: string;
    placeholders: Array<{name: string, value: string}>;
}

export interface WorkableObject {
    actionId: string;
    actionType: string;
    reactionId: string;
    reactionType: string;
    reactionOptions: object;
    areaId: string;
    areaName: string;
    ownerId: string;
    ownerEmail: string;
    actionPlaceholders: Array<{name: string, value: string}>;
    reactionPreparedData: object;
}

export interface LoginObject {
    user: UserProfile;
    redirectUrl: string;
    ctx: Context;
}

const redisHost: string = process.env.REDIS_HOST ? process.env.REDIS_HOST : '127.0.0.1';
const redisPort: number = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379;
const redisPass: string|undefined = process.env.REDIS_PASSWORD;
const queueName: string = process.env.BULL_QUEUE_NAME ? process.env.BULL_QUEUE_NAME : 'areaQueue';
const workerQueue = new Queue(queueName, {
    redis: {
        host: redisHost,
        port: redisPort,
        password: redisPass
    }
});

export async function ActionFunction(params: TriggerObject, ctx: Context) {
    try {
        let userRepository : UserRepository | null = null;
        let actionRepository : ActionRepository | null = null;
        let reactionRepository : ReactionRepository | null = null;
        let areaRepository : AreaRepository | null = null;
        try {
            userRepository = await ctx.get('repositories.UserRepository');
            actionRepository = await ctx.get('repositories.ActionRepository');
            reactionRepository = await ctx.get('repositories.ReactionRepository');
            areaRepository = await ctx.get('repositories.AreaRepository');
        } catch (e) {
            console.error(`[RepositoryResolve]Failed to enqueue job for action id ${params.actionId}: ${e}`);
            return;
        }
        if (!userRepository || !actionRepository || !reactionRepository || !areaRepository) {
            console.error(`[RepositoryResolveCheck]Failed to enqueue job for action id ${params.actionId}: could not resolve repositories`);
            return;
        }
        let action : Action | null = null;
        try {
            action = await actionRepository.findById(params.actionId);
        } catch (e) {
            console.error(`[ActionResolve]Failed to enqueue job for action id ${params.actionId}: ${e}`);
            return;
        }
        if (!action) {
            console.error(`[ActionResolveCheck]Failed to enqueue job for action id ${params.actionId}: could not resolve action`);
            return;
        }
        let area : Area | null = null;
        try {
            area = await areaRepository.findById(action.areaId, {
                include: [{
                    relation: 'reactions'
                }],
            });
        } catch (e) {
            console.error(`[AreaResolve]Failed to enqueue job for action id ${params.actionId}: ${e}`);
            return;
        }
        if (!area) {
            console.error(`[AreaResolveCheck]Failed to enqueue job for action id ${params.actionId}: could not resolve area linked to action`);
            return;
        }
        if (!area.reactions || area.reactions.length === 0) {
            console.debug(`[AreaResolveCheck]Area id ${area.id!} has no reactions. Ignoring action ${params.actionId}`);
            return;
        }
        let owner : User | null = null;
        try {
            owner = await userRepository.findOne({
                where: {
                    email: area.ownerId
                }
            });
        } catch (e) {
            console.error(`[OwnerResolve]Failed to enqueue job for action id ${params.actionId}: ${e}`);
            return;
        }
        if (!owner) {
            console.error(`[OwnerResolveCheck]Failed to enqueue job for action id ${params.actionId}: could not resolve owner linked to area`);
            return;
        }
        for (const reaction of area.reactions) {
            const serviceName = reaction.serviceReaction.split('.')[0];
            const reactionName = reaction.serviceReaction.split('.')[2];
            try {
                const module = await import('./area-services/' + serviceName + '/reactions/' + reactionName + '/controller');
                const controller = module.default;
                let reactionPreparedData = null;
                try {
                    reactionPreparedData = await controller.prepareData(reaction.id!, ctx);
                } catch (e) {
                    console.error(`Failed to enqueue job for action id ${params.actionId}, reaction id ${reaction.id}:`, e);
                    continue;
                }
                const dataPlaceholders = [
                    {name: "actionId", value: action.id!},
                    {name: "actionType", value: action.serviceAction},
                    {name: "reactionId", value: reaction.id!},
                    {name: "reactionType", value: reaction.serviceReaction},
                    {name: "areaId", value: area.id!},
                    {name: "areaName", value: area.name},
                    {name: "ownerId", value: owner.id!},
                    {name: "ownerEmail", value: owner.email},
                ];
                const finalPlaceholders = params.placeholders.filter((elem) => {
                    for (const dataPlaceHolder of dataPlaceholders) {
                        if (dataPlaceHolder.name === elem.name) {
                            return false;
                        }
                    }
                    return true;
                }).concat(dataPlaceholders);
                const preparedData: WorkableObject = {
                    actionId: action.id!,
                    actionType: action.serviceAction,
                    actionPlaceholders: finalPlaceholders,
                    areaId: area.id!,
                    areaName: area.name,
                    ownerEmail: owner.email,
                    ownerId: owner.id!,
                    reactionId: reaction.id!,
                    reactionOptions: reaction.options,
                    reactionPreparedData: reactionPreparedData,
                    reactionType: reaction.serviceReaction
                };
                workerQueue.add(preparedData).catch(e => console.error(`Failed to enqueue job for action id ${params.actionId}, reaction id ${reaction.id}: ${e}`));
            } catch (e) {
                console.error(`[ServiceResolve]Failed to enqueue job for action id ${params.actionId}: could not find reaction ${reactionName} in service ${serviceName}`);
            }
        }
    } catch (e) {
        console.error(`[ServiceResolve]An unknown error occurred while processing action id ${params.actionId}:`, e);
    }
}

export function applyPlaceholders(element: string, placeholders: Array<{name: string, value: string}>): string {
    for (const placeholder of placeholders) {
        element = element.replace(`{${placeholder.name}}`, placeholder.value);
    }
    return element;
}

export interface ServiceConfig {
    displayName: string;
    description: string;
    icon: string;
    color: string;
}

export interface ConfigShema {
    name: string;
    description: string;
    type: string;
    required: boolean;
    default?: number|string|boolean;
}

export interface Placeholder {
    name: string;
    description: string;
}

export interface ActionConfig {
    displayName: string;
    description: string;
    configSchema: ConfigShema[];
    placeholders: Placeholder[];
}

export interface ReactionConfig {
    displayName: string;
    description: string;
    configSchema: ConfigShema[];
}

export interface OperationStatus {
    success: boolean;
    options?: Object;
    data?: Object;
    error?: string;
    details?: Object;
}

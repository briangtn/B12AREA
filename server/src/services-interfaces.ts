import {Context} from "@loopback/context";
import {UserProfile} from "@loopback/security";
import WorkerHelper from "./WorkerHelper";

export interface TriggerObject {
    actionId: string;
    placeholders: Array<{name: string, value: string}>;
}

export interface DelayedJobObject {
    service: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jobData: any;
    triggerIn?: number; //milliseconds
    triggerAt?: Date;
    name: string;
}

export interface PullingJobObject {
    service: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jobData: any;
    triggerEvery: number; //milliseconds
    name: string;
}

export interface PullingData {
    url: string;
    params: object;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    diffFunction: (data: any) => Promise<any[] | null>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onDiff: (diff: any[]) => Promise<void>;
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

export async function ActionFunction(params: TriggerObject, ctx: Context) {
    await WorkerHelper.ActionFunction(params, ctx);
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

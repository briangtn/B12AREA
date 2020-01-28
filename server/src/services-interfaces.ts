export interface TriggerObject {
    from: string;
    placeholders: Array<{name: string, value: string}>;
}

export interface LoginObject {
    redirectUrl: string;
}

export interface ActionFunctionType {
    (params: TriggerObject): void;
}

export function ActionFunction(params: TriggerObject) {
    //todo: call callback function
}

export interface ServiceConfig {
    displayName: string;
    description: string;
}

export interface ConfigShema {
    name: string;
    type: string;
    required: boolean;
    default: number|string|boolean;
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

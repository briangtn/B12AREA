import Queue from "bull";

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

export function ActionFunction(params: TriggerObject) {
    workerQueue.add(params).catch(e => console.error(`Failed to enqueue job ${e}`));
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

import {Entity, model, property} from '@loopback/repository';

@model()
export class GithubWebhook extends Entity {
    @property({
        type: 'string',
        id: true,
        generated: true,
    })
    id?: string;

    @property({
        type: 'string',
    })
    owner?: string;

    @property({
        type: 'string',
    })
    repo?: string;

    @property({
        type: 'string',
    })
    type?: string;

    @property({
        type: 'number',
    })
    githubId?: number;

    @property({
        type: 'string',
    })
    name?: string;

    @property({
        type: 'boolean',
    })
    active?: boolean;

    @property({
        type: 'array',
        itemType: 'string',
    })
    events?: string[];

    @property({
        type: 'object',
    })
    config?: object;

    @property({
        type: 'date',
    })
    updatedAt?: string;

    @property({
        type: 'date',
    })
    createdAt?: string;

    @property({
        type: 'string',
    })
    url?: string;

    @property({
        type: 'string',
    })
    testUrl?: string;

    @property({
        type: 'string',
    })
    pingUrl?: string;

    @property({
        type: 'object',
    })
    lastResponse?: object;


    constructor(data?: Partial<GithubWebhook>) {
        super(data);
    }
}

export interface GithubWebhookRelations {
    // describe navigational properties here
}

export type GithubWebhookWithRelations = GithubWebhook & GithubWebhookRelations;

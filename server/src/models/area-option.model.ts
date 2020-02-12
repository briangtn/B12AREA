import {Entity, model, property} from '@loopback/repository';

@model({settings: {strictObjectIDCoercion: true}})
export class AreaOption extends Entity {
    @property({
        type: 'string',
        id: true,
        generated: true,
    })
    id?: string;

    @property({
        type: 'string',
        required: true,
    })
    name: string;

    @property({
        type: 'object',
        required: true,
    })
    value: object;

    @property({
        type: 'string',
    })
    reactionId?: string;

    @property({
        type: 'string',
    })
    actionId?: string;

    constructor(data?: Partial<AreaOption>) {
        super(data);
    }
}

export interface AreaOptionRelations {
    // describe navigational properties here
}

export type AraeOptionWithRelations = AreaOption & AreaOptionRelations;

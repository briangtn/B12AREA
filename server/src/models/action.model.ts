import {Entity, model, property} from '@loopback/repository';

@model({settings: {strict: false, strictObjectIDCoercion: true}})
export class Action extends Entity {
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
    serviceAction: string;

    @property({
        type: 'string',
    })
    areaId?: string;

    options: Object[];
    // Define well-known properties here

    // Indexer property to allow additional data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [prop: string]: any;

    constructor(data?: Partial<Action>) {
        super(data);
    }
}

export interface ActionRelations {
    // describe navigational properties here
}

export type ActionWithRelations = Action & ActionRelations;

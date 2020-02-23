import {Entity, model, property, hasOne, belongsTo} from '@loopback/repository';
import {Area} from './area.model';

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

    @belongsTo(() => Area, {name: 'area'})
    areaId?: string;

    @property({
        type: 'object',
    })
    options: object;

    @property({
        type: 'object',
        default: {},
        required: false
    })
    data?: object;

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

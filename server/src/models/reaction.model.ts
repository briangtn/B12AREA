import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Area} from "./area.model";

@model({settings: {strict: false, strictObjectIDCoercion: true}})
export class Reaction extends Entity {
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
    serviceReaction: string;
    @belongsTo(() => Area, {name: 'area'})
    areaId?: string;

    @property({
        type: 'object',
    })
    options: object;
    // Define well-known properties here

    // Indexer property to allow additional data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [prop: string]: any;

    constructor(data?: Partial<Reaction>) {
        super(data);
    }
}

export interface ReactionRelations {
    // describe navigational properties here
}

export type ReactionWithRelations = Reaction & ReactionRelations;

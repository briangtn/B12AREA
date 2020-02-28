import {Entity, model, property} from '@loopback/repository';

@model()
export class BullNameToIdMap extends Entity {
    @property({
        type: 'string',
        required: true,
    })
    JobName: string;

    @property({
        type: 'string',
        required: true,
    })
    JobId: string;

    @property({
        type: 'string',
        id: true,
        generated: true,
    })
    id?: string;


    constructor(data?: Partial<BullNameToIdMap>) {
        super(data);
    }
}

export interface BullNameToIdMapRelations {
    // describe navigational properties here
}

export type BullNameToIdMapWithRelations = BullNameToIdMap & BullNameToIdMapRelations;

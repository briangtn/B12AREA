import {Entity, model, property} from '@loopback/repository';

@model({settings: {strict: false, strictObjectIDCoercion: true}})
export class DataExchangeCode extends Entity {
    @property({
        type: 'string',
        id: true,
        index: true,
        generated: true,
    })
    id?: string;

    @property({
        type: 'string',
        required: true,
    })
    code: string;

    @property({
        type: 'object',
        required: true,
    })
    data: object;

    @property({
        type: 'boolean',
        required: false,
        default: true
    })
    public?: boolean;

    constructor(data?: Partial<DataExchangeCode>) {
        super(data);
    }
}

export interface DataExchangeCodeRelations {
    // describe navigational properties here
}

export type DataExchangeCodeWithRelations = DataExchangeCode & DataExchangeCodeRelations;

import {Entity, model, property} from '@loopback/repository';

@model({settings: {strict: false}})
export class User extends Entity {
    @property({
        type: 'string',
        id: true,
        generated: true,
    })
    id?: string;

    @property({
        type: 'string',
        required: true,
        index: {
            unique: true
        }
    })
    email: string;

    @property({
        type: 'string',
    })
    password?: string;

    @property({
        type: 'array',
        itemType: 'string',
        default: [],
    })
    role?: string[];

    @property({
        type: 'array',
        itemType: 'object',
        default: [],
    })
    services?: object[];

    @property({
        type: 'string',
        required: false,
    })
    validation_token?: string;

    @property({
        type: 'string',
    })
    reset_token?: string;

    // Define well-known properties here

    // Indexer property to allow additional data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [prop: string]: any;

    constructor(data?: Partial<User>) {
        super(data);
    }
}

export interface UserRelations {
    // describe navigational properties here
}

export type UserWithRelations = User & UserRelations;

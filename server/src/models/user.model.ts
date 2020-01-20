import {Entity, model, property} from '@loopback/repository';

@model({
    settings: {
        hiddenProperties: ['password', 'validationToken', 'resetToken', 'twoFactorAuthenticationSecret'],
        indexes: {
            uniqueEmail: {
                keys: {
                    email: 1,
                },
                options: {
                    unique: true,
                },
            },
        },
    },
})
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
    validationToken?: string;

    @property({
        type: 'string',
    })
    resetToken?: string;

    @property({
        type: 'string',
    })
    twoFactorAuthenticationSecret?: string;

    @property({
        type: 'boolean',
        default: false,
    })
    twoFactorAuthenticationEnabled: boolean;

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

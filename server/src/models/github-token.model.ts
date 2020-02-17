import {Entity, model, property, belongsTo} from '@loopback/repository';
import {User} from './user.model';

@model()
export class GithubToken extends Entity {
    @property({
        type: 'string',
        required: true,
    })
    token: string;

    @property({
        type: 'string',
        id: true,
        generated: true,
    })
    id?: string;

    @belongsTo(() => User)
    userId: string;

    constructor(data?: Partial<GithubToken>) {
        super(data);
    }
}

export interface GithubTokenRelations {
    // describe navigational properties here
}

export type GithubTokenWithRelations = GithubToken & GithubTokenRelations;

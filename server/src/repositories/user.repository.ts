import {
    DefaultCrudRepository,
    juggler,
} from '@loopback/repository';
import {User} from '../models';
import {inject} from '@loopback/core';

export type Credentials = {
    email: string;
    password: string;
};

export class UserRepository extends DefaultCrudRepository<
    User,
    typeof User.prototype.id
    > {
    constructor(
        @inject('datasources.mongo') protected datasource: juggler.DataSource,
    ) {
        super(User, datasource);
    }
}
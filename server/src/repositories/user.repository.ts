import {
    DefaultCrudRepository,
    juggler,
} from '@loopback/repository';
import {User} from '../models';
import {inject} from '@loopback/core';

export class UserRepository extends DefaultCrudRepository<
    User,
    typeof User.prototype.id
    > {
    constructor(
        @inject('datasources.mongo') protected datasource: juggler.DataSource,
    ) {
        super(User, datasource);
    }

    async validateEmail(userId: string): Promise<User|null> {
        const user: User|null = await this.findById(userId);
        if (!user)
            return null;
        const newRoles = user.role?.filter((role: string) => {return role !== 'email_not_validated' && role !== 'user'});
        if (newRoles)
            newRoles.push('user');
        await this.updateById(userId, {
            validationToken: undefined,
            role: newRoles
        });
        return this.findById(userId);
    }
}
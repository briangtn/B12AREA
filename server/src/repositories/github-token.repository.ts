import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {GithubToken, GithubTokenRelations, User} from '../models';
import {MongoDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {UserRepository} from './user.repository';

export class GithubTokenRepository extends DefaultCrudRepository<
    GithubToken,
    typeof GithubToken.prototype.id,
    GithubTokenRelations
    > {

    public readonly user: BelongsToAccessor<User, typeof GithubToken.prototype.id>;

    constructor(
        @inject('datasources.mongo') dataSource: MongoDataSource, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>,
    ) {
        super(GithubToken, dataSource);
        this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter,);
        this.registerInclusionResolver('user', this.user.inclusionResolver);
    }
}

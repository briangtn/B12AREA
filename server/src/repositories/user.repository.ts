import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {User, UserRelations, Area} from '../models';
import {MongoDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {AreaRepository} from './area.repository';

export type Credentials = {
    email: string;
    password: string;
};

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id,
  UserRelations
> {

  public readonly areas: HasManyRepositoryFactory<Area, typeof User.prototype.id>;

  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource, @repository.getter('AreaRepository') protected areaRepositoryGetter: Getter<AreaRepository>,
  ) {
    super(User, dataSource);
    this.areas = this.createHasManyRepositoryFactoryFor('areas', areaRepositoryGetter,);
    this.registerInclusionResolver('areas', this.areas.inclusionResolver);
  }
}

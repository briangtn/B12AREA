import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {Area, AreaRelations, Reaction} from '../models';
import {MongoDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {ReactionRepository} from './reaction.repository';

export class AreaRepository extends DefaultCrudRepository<Area,
    typeof Area.prototype.id,
    AreaRelations> {

  public readonly reactions: HasManyRepositoryFactory<Reaction, typeof Area.prototype.id>;

    constructor(
        @inject('datasources.mongo') dataSource: MongoDataSource, @repository.getter('ReactionRepository') protected reactionRepositoryGetter: Getter<ReactionRepository>,
    ) {
        super(Area, dataSource);
      this.reactions = this.createHasManyRepositoryFactoryFor('reactions', reactionRepositoryGetter,);
      this.registerInclusionResolver('reactions', this.reactions.inclusionResolver);
    }
}

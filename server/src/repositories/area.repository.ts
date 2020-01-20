import {
    DefaultCrudRepository,
    repository,
    HasManyRepositoryFactory,
    HasOneRepositoryFactory
} from '@loopback/repository';
import {Area, AreaRelations, Reaction, Action} from '../models';
import {MongoDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {ReactionRepository} from './reaction.repository';
import {ActionRepository} from './action.repository';

export class AreaRepository extends DefaultCrudRepository<Area,
    typeof Area.prototype.id,
    AreaRelations> {

    public readonly reactions: HasManyRepositoryFactory<Reaction, typeof Area.prototype.id>;

    public readonly action: HasOneRepositoryFactory<Action, typeof Area.prototype.id>;

    constructor(
        @inject('datasources.mongo') dataSource: MongoDataSource, @repository.getter('ReactionRepository') protected reactionRepositoryGetter: Getter<ReactionRepository>, @repository.getter('ActionRepository') protected actionRepositoryGetter: Getter<ActionRepository>,
    ) {
        super(Area, dataSource);
        this.action = this.createHasOneRepositoryFactoryFor('action', actionRepositoryGetter,);
        this.registerInclusionResolver('actions', this.action.inclusionResolver);
        this.reactions = this.createHasManyRepositoryFactoryFor('reactions', reactionRepositoryGetter,);
        this.registerInclusionResolver('reactions', this.reactions.inclusionResolver);
    }
}

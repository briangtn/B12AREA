import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {Reaction, ReactionRelations, AreaOption} from '../models';
import {MongoDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {AreaOptionRepository} from './area-option.repository';

export class ReactionRepository extends DefaultCrudRepository<Reaction,
    typeof Reaction.prototype.id,
    ReactionRelations> {

    public readonly options: HasManyRepositoryFactory<AreaOption, typeof Reaction.prototype.id>;

    constructor(
        @inject('datasources.mongo') dataSource: MongoDataSource, @repository.getter('AreaOptionRepository') protected areaOptionRepositoryGetter: Getter<AreaOptionRepository>,
    ) {
        super(Reaction, dataSource);
        this.options = this.createHasManyRepositoryFactoryFor('options', areaOptionRepositoryGetter,);
        this.registerInclusionResolver('options', this.options.inclusionResolver);
    }
}

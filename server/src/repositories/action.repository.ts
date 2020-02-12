import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {Action, ActionRelations, AreaOption} from '../models';
import {MongoDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {AreaOptionRepository} from './area-option.repository';

export class ActionRepository extends DefaultCrudRepository<Action,
    typeof Action.prototype.id,
    ActionRelations> {

    public readonly options: HasManyRepositoryFactory<AreaOption, typeof Action.prototype.id>;

    constructor(
        @inject('datasources.mongo') dataSource: MongoDataSource, @repository.getter('AreaOptionRepository') protected areaOptionRepositoryGetter: Getter<AreaOptionRepository>,
    ) {
        super(Action, dataSource);
        this.options = this.createHasManyRepositoryFactoryFor('options', areaOptionRepositoryGetter,);
        this.registerInclusionResolver('options', this.options.inclusionResolver);
    }
}

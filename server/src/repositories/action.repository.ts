import {DefaultCrudRepository} from '@loopback/repository';
import {Action, ActionRelations} from '../models';
import {MongoDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class ActionRepository extends DefaultCrudRepository<Action,
    typeof Action.prototype.id,
    ActionRelations> {

    constructor(
        @inject('datasources.mongo') dataSource: MongoDataSource,
    ) {
        super(Action, dataSource);
    }
}

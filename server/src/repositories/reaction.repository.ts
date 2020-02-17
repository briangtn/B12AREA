import {DefaultCrudRepository} from '@loopback/repository';
import {Reaction, ReactionRelations} from '../models';
import {MongoDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class ReactionRepository extends DefaultCrudRepository<Reaction,
    typeof Reaction.prototype.id,
    ReactionRelations> {

    constructor(
        @inject('datasources.mongo') dataSource: MongoDataSource,
    ) {
        super(Reaction, dataSource);
    }
}

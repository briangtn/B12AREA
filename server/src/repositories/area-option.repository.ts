import {DefaultCrudRepository} from '@loopback/repository';
import {AreaOption, AreaOptionRelations} from '../models';
import {MongoDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class AreaOptionRepository extends DefaultCrudRepository<AreaOption,
    typeof AreaOption.prototype.id,
    AreaOptionRelations> {
    constructor(
        @inject('datasources.mongo') dataSource: MongoDataSource,
    ) {
        super(AreaOption, dataSource);
    }
}

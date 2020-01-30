import {DefaultCrudRepository} from '@loopback/repository';
import {DataExchangeCode, DataExchangeCodeRelations} from '../models';
import {MongoDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class DataExchangeCodeRepository extends DefaultCrudRepository<
    DataExchangeCode,
    typeof DataExchangeCode.prototype.id,
    DataExchangeCodeRelations
    > {
    constructor(
        @inject('datasources.mongo') dataSource: MongoDataSource,
    ) {
        super(DataExchangeCode, dataSource);
    }
}

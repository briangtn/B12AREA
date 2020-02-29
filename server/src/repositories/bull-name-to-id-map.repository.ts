import {DefaultCrudRepository} from '@loopback/repository';
import {BullNameToIdMap, BullNameToIdMapRelations} from '../models';
import {MongoDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class BullNameToIdMapRepository extends DefaultCrudRepository<
    BullNameToIdMap,
    typeof BullNameToIdMap.prototype.id,
    BullNameToIdMapRelations
    > {
    constructor(
        @inject('datasources.mongo') dataSource: MongoDataSource,
    ) {
        super(BullNameToIdMap, dataSource);
    }
}

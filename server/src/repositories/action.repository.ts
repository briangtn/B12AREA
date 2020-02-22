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

    async getActionSettings(actionID: string): Promise<Object | null> {
        const area = await this.findById(actionID);
        if (!area) {
            return null;
        }
        return area.options ? area.options : {};
    }

    async getActionOwnerID(actionID: string): Promise<string | null> {
        const action = await this.findById(actionID, {
            include: [{
                relation: 'area'
            }],
        });
        if (!action)
            return null;
        return action.area.ownerId;
    }

    async getActionData(actionID: string): Promise<object | null> {
        const area = await this.findById(actionID);
        if (!area) {
            return null;
        }
        return area.data ? area.data : {};
    }

    async setActionData(actionID: string, data: object) {
        await this.updateById(actionID, {data});
    }

    async emptyActionData(actionID: string) {
        await this.updateById(actionID, {data: {}});
    }
}

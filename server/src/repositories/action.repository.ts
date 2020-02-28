import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {Action, ActionRelations, Area} from '../models';
import {MongoDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {AreaRepository} from './area.repository';

export class ActionRepository extends DefaultCrudRepository<Action,
    typeof Action.prototype.id,
    ActionRelations> {

    public readonly area: BelongsToAccessor<
        Area,
        typeof Action.prototype.id
    >;

    constructor(
        @inject('datasources.mongo') dataSource: MongoDataSource,
        @repository.getter('AreaRepository') areaRepositoryGetter: Getter<AreaRepository>
    ) {
        super(Action, dataSource);
        this.area = this.createBelongsToAccessorFor('area', areaRepositoryGetter);
        this.registerInclusionResolver('area', this.area.inclusionResolver);
    }

    async getActionSettings(actionID: string): Promise<Object | null> {
        const area = await this.findById(actionID);
        if (!area) {
            return null;
        }
        return area.options ? area.options : {};
    }

    async getActionOwnerID(actionID: string): Promise<string | null> {
        try {
            const action = await this.findById(actionID, {include: [{relation: 'area', scope: {include: [{relation: 'user'}]}}]});
            if (!action || !action.area || !action.area.user)
                return null;
            return action.area.user.id;
        } catch (e) {
            return null;
        }
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

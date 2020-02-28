import {
    DefaultCrudRepository,
    repository,
    BelongsToAccessor,
    Condition,
    AndClause,
    OrClause, AnyObject, Count
} from '@loopback/repository';
import {Action, ActionRelations, Area} from '../models';
import {MongoDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {UserRepository} from './user.repository';
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
        @repository(UserRepository) public userRepository: UserRepository,
        @repository.getter('AreaRepository')
        areaRepositoryGetter: Getter<AreaRepository>
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
            const action = await this.findById(actionID, {include: [{relation: 'area'}]});
            if (!action)
                return null;
            const user = await this.userRepository.findOne({where: {email: action.area.ownerId}});
            if (!user || !user.id)
                return null;
            return user.id;
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

    deleteAll(where?: Condition<Action> | AndClause<Action> | OrClause<Action>, options?: AnyObject): Promise<Count> {
        console.log("Call delete hook for ", where);
        return super.deleteAll(where, options);
    }

    deleteById(id: typeof Action.prototype.id, options?: AnyObject): Promise<void> {
        console.log("Call delete hook for ", id);
        return super.deleteById(id, options);
    }
}

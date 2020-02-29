import {
    DefaultCrudRepository,
    repository,
    BelongsToAccessor,
    Condition,
    AndClause,
    OrClause, AnyObject, Count, DeepPartial
} from '@loopback/repository';
import {ActionRelations, Area, Action} from '../models';
import {MongoDataSource} from '../datasources';
import {inject, Getter, Context} from '@loopback/core';
import {UserRepository} from './user.repository';
import {AreaRepository} from './area.repository';
import {OperationStatus} from "../services-interfaces";
import {HttpErrors} from "@loopback/rest/dist";

type IdAction = typeof Action.prototype.id;
type FilterAction = Condition<Action> | AndClause<Action> | OrClause<Action>;
type WhereOrIdAction =  FilterAction | IdAction;
type PartialAction = Partial<Action> | { [P in keyof Action]?: DeepPartial<Action[P]> };


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
        areaRepositoryGetter: Getter<AreaRepository>,
        @inject.context() private ctx: Context,
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

    private async resolveActionController(actionType: string) {
        const serviceName = actionType.split('.')[0];
        const actionName = actionType.split('.')[2];

        const module = await import(`../area-services/${serviceName}/actions/${actionName}/controller`);
        return module.default;
    }

    private async getByWhereOrId(where: WhereOrIdAction) {
        if (typeof where === typeof Action.prototype.id) {
            return this.findById(where as typeof Action.prototype.id);
        } else {
            return this.findOne({
                where: where as Condition<Action> | AndClause<Action> | OrClause<Action>
            });
        }
    }

    async beforeUpdate(data: PartialAction, where?: WhereOrIdAction, options?: AnyObject) : Promise<OperationStatus> {
        const dbAction = await this.getByWhereOrId(where);
        if (!dbAction)
            throw new Error('Could not fetch action');

        let controller;
        try {
            controller = await this.resolveActionController(dbAction.serviceAction);
        } catch (e) {
            throw new HttpErrors.BadRequest('Action not found');
        }

        let result : OperationStatus;
        try {
            result = await controller.updateAction(dbAction.id!, dbAction.options, data.options, this.ctx);
        } catch (e) {
            throw new HttpErrors.BadRequest('Failed to update action in service');
        }
        if (!result.success) {
            throw new HttpErrors.BadRequest(result.error);
        }
        return result;
    }

    async beforeCreate(action: PartialAction, options?: AnyObject) : Promise<OperationStatus> {
        console.log(action);
        const areaRepository : AreaRepository = await this.ctx.get('repositories.AreaRepository');
        const userEmail = (await areaRepository.findById(action.areaId)).ownerId;
        const user = await this.userRepository.findOne({
            where: {
                email: userEmail
            }
        });

        if (!user)
            throw new HttpErrors.InternalServerError('Failed to resolve user');
        let controller;
        try {
            controller = await this.resolveActionController(action.serviceAction!);
        } catch (e) {
            throw new HttpErrors.BadRequest('Action not found');
        }
        let result : OperationStatus;
        try {
            result = await controller.createAction(user.id!, action.options, this.ctx);
        } catch (e) {
            throw new HttpErrors.BadRequest('Failed to create action in service');
        }
        if (!result.success) {
            throw new HttpErrors.BadRequest(result.error);
        }
        return result;
    }


    async beforeDelete(where?: WhereOrIdAction, options?: AnyObject) : Promise<OperationStatus> {
        const action = await this.getByWhereOrId(where);
        if (!action)
            throw new Error('Could not fetch action');

        let controller;
        try {
            controller = await this.resolveActionController(action.serviceAction);
        } catch (e) {
            throw new HttpErrors.BadRequest('Action controller not found');
        }

        let result : OperationStatus;
        try {
            result = await controller.deleteAction(action.id!, action.options, this.ctx);
        } catch (e) {
            throw new HttpErrors.BadRequest('Failed to update action in service');
        }
        if (!result.success) {
            throw new HttpErrors.BadRequest(result.error);
        }
        return result;
    }

    deleteById(id: typeof Action.prototype.id, options?: AnyObject): Promise<void> {
        return this.beforeDelete(id, options).then(() => {
            return super.deleteById(id, options);
        }).catch((err) => {
            console.error(err);
            return err;
        });
    }

    deleteAll(where?: FilterAction, options?: AnyObject): Promise<Count> {
        return this.beforeDelete(where, options).then(() => {
            return super.deleteAll(where as FilterAction, options);
        }).catch((err) => {
            console.error(err);
            return err;
        });
    }

    updateAll(data: PartialAction | Action, where?: FilterAction, options?: AnyObject): Promise<Count> {
        return this.beforeUpdate(data, where, options).then((operationStatus: OperationStatus) => {
            data.options = operationStatus.options;
            return super.updateAll(data, where as FilterAction, options);
        }).catch((err) => {
            console.error(err);
            return err;
        });
    }

    updateById(id: typeof Action.prototype.id, data: PartialAction | Action, options?: AnyObject): Promise<void> {
        return this.beforeUpdate(data, id, options).then((operationStatus: OperationStatus) => {
            data.options = operationStatus.options;
            return super.updateById(id, data, options);
        }).catch((err) => {
            console.error(err);
            return err;
        });
    }

    create(entity: PartialAction | Action, options?: AnyObject): Promise<Action> {
        return this.beforeCreate(entity, options).then((operationStatus: OperationStatus) => {
            entity.options = operationStatus.options;
            return super.create(entity, options);
        }).catch((err) => {
            console.error(err);
            return err;
        });
    }
}

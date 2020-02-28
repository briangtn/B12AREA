import {
    AndClause, AnyObject,
    BelongsToAccessor,
    Condition, Count, DeepPartial,
    DefaultCrudRepository,
    OrClause,
    repository
} from '@loopback/repository';
import {Area, Reaction, ReactionRelations} from '../models';
import {MongoDataSource} from '../datasources';
import {Getter, inject} from '@loopback/core';
import {UserRepository} from "./user.repository";
import {AreaRepository} from "./area.repository";
import {HttpErrors} from "@loopback/rest/dist";
import {OperationStatus} from "../services-interfaces";
import {Context} from "@loopback/context";

type IdReaction = typeof Reaction.prototype.id;
type FilterReaction = Condition<Reaction> | AndClause<Reaction> | OrClause<Reaction>;
type WhereOrIdReaction =  FilterReaction | IdReaction;
type UpdateReaction = Partial<Reaction> | { [P in keyof Reaction]?: DeepPartial<Reaction[P]> };

export class ReactionRepository extends DefaultCrudRepository<Reaction,
    typeof Reaction.prototype.id,
    ReactionRelations> {
    public readonly area: BelongsToAccessor<
        Area,
        typeof Reaction.prototype.id
        >;

    context: Context;

    constructor(
        @inject('datasources.mongo') dataSource: MongoDataSource,
        @repository(UserRepository) public userRepository: UserRepository,
        @repository.getter('AreaRepository') areaRepositoryGetter: Getter<AreaRepository>,
        @inject.context() private ctx: Context
    ) {
        super(Reaction, dataSource);
        this.area = this.createBelongsToAccessorFor('area', areaRepositoryGetter);
        this.registerInclusionResolver('area', this.area.inclusionResolver);
    }

    async getReactionOwnerID(reactionID: string): Promise<string | null> {
        try {
            const action = await this.findById(reactionID, {include: [{relation: 'area'}]});
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

    private async resolveReactionController(reactionType: string) {
        const serviceName = reactionType.split('.')[0];
        const reactionName = reactionType.split('.')[2];

        const module = await import(`../area-services/${serviceName}/reactions/${reactionName}/controller`);
        return module.default;
    }

    private async getByWhereOrId(where: WhereOrIdReaction) {
        if (typeof where === typeof Reaction.prototype.id) {
            return this.findById(where as typeof Reaction.prototype.id);
        } else {
            return this.findOne({
                where: where as Condition<Reaction> | AndClause<Reaction> | OrClause<Reaction>
            });
        }
    }

    async beforeUpdate(data: UpdateReaction, where?: WhereOrIdReaction, options?: AnyObject) : Promise<OperationStatus> {
        const dbReaction = await this.getByWhereOrId(where);
        if (!dbReaction)
            throw new Error('Could not fetch reaction');

        let controller;
        try {
            controller = await this.resolveReactionController(dbReaction.serviceReaction);
        } catch (e) {
            throw new HttpErrors.BadRequest('Reaction not found');
        }

        let result : OperationStatus;
        try {
            result = await controller.updateReaction(dbReaction.id!, dbReaction.options, data.options, this.ctx);
        } catch (e) {
            throw new HttpErrors.BadRequest('Failed to update action in service');
        }
        if (!result.success) {
            throw new HttpErrors.BadRequest(result.error);
        }
        return result;
    }

    async beforeCreate(where?: WhereOrIdReaction, options?: AnyObject) : Promise<void> {
    }


    async beforeDelete(where?: WhereOrIdReaction, options?: AnyObject) : Promise<OperationStatus> {
        const reaction = await this.getByWhereOrId(where);
        if (!reaction)
            throw new Error('Could not fetch reaction');

        let controller;
        try {
            controller = await this.resolveReactionController(reaction.serviceReaction);
        } catch (e) {
            throw new HttpErrors.BadRequest('Reaction controller not found');
        }

        let result : OperationStatus;
        try {
            result = await controller.deleteReaction(reaction.id!, reaction.options, this.ctx);
        } catch (e) {
            throw new HttpErrors.BadRequest('Failed to update action in service');
        }
        if (!result.success) {
            throw new HttpErrors.BadRequest(result.error);
        }
        return result;
    }

    async deleteById(id: typeof Reaction.prototype.id, options?: AnyObject): Promise<void> {
        return this.beforeDelete(id, options).then(() => {
            return super.deleteById(id, options);
        }).catch((err) => {
            console.error(err);
            return err;
        });
    }

    deleteAll(where?: FilterReaction, options?: AnyObject): Promise<Count> {
        return this.beforeDelete(where, options).then(() => {
            return super.deleteAll(where as FilterReaction, options);
        }).catch((err) => {
            console.error(err);
            return err;
        });
    }


    updateAll(data: UpdateReaction | Reaction, where?: FilterReaction, options?: AnyObject): Promise<Count> {
        return this.beforeUpdate(data, where, options).then((operationStatus: OperationStatus) => {
            data.options = operationStatus.options;
            return super.updateAll(data, where as FilterReaction, options);
        }).catch((err) => {
            console.error(err);
            return err;
        });
    }

    updateById(id: typeof Reaction.prototype.id, data: UpdateReaction | Reaction, options?: AnyObject): Promise<void> {
        return this.beforeUpdate(data, id, options).then((operationStatus: OperationStatus) => {
            data.options = operationStatus.options;
            return super.updateById(id, data, options);
        }).catch((err) => {
            console.error(err);
            return err;
        });
    }
}

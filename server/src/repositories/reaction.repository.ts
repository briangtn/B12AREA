import {
    AndClause, AnyObject,
    BelongsToAccessor,
    Condition, Count, DeepPartial,
    DefaultCrudRepository,
    OrClause,
    repository
} from '@loopback/repository';
import {Action, Area, Reaction, ReactionRelations, ReactionWithRelations} from '../models';
import {MongoDataSource} from '../datasources';
import {Getter, inject} from '@loopback/core';
import {AreaRepository} from "./area.repository";
import {HttpErrors} from "@loopback/rest/dist";
import {OperationStatus} from "../services-interfaces";
import {Context} from "@loopback/context";
import {UserRepository} from "./user.repository";

type IdReaction = typeof Reaction.prototype.id;
type FilterReaction = Condition<Reaction> | AndClause<Reaction> | OrClause<Reaction>;
type WhereOrIdReaction =  FilterReaction | IdReaction;
type PartialReaction = Partial<Reaction> | { [P in keyof Reaction]?: DeepPartial<Reaction[P]> };

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
        @repository.getter('AreaRepository') areaRepositoryGetter: Getter<AreaRepository>,
        @inject.context() private ctx: Context,
    ) {
        super(Reaction, dataSource);
        this.area = this.createBelongsToAccessorFor('area', areaRepositoryGetter);
        this.registerInclusionResolver('area', this.area.inclusionResolver);
    }

    async getReactionOwnerID(reactionID: string): Promise<string | null> {
        try {
            const reaction = await this.findById(reactionID, {include: [{relation: 'area', scope: {include: [{relation: 'user'}]}}]});
            if (!reaction || !reaction.area || !reaction.area.user)
                return null;
            return reaction.area.user.id;
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

    private async getByWhereOrId(where?: WhereOrIdReaction, options?: AnyObject) : Promise<ReactionWithRelations[]> {
        if (typeof where === "string") {
            return [await this.findById(where, options)];
        } else if (where !== undefined) {
            return this.find({
                where: where
            }, options);
        } else {
            return this.find({}, options);
        }
    }

    async beforeUpdate(data: PartialReaction, where?: WhereOrIdReaction, options?: AnyObject) : Promise<OperationStatus> {
        const reactions = await this.getByWhereOrId(where, options);
        let result : OperationStatus = {success: true};
        for (const reaction of reactions) {
            if (data.serviceReaction && data.serviceReaction !== reaction.serviceReaction)
                throw new HttpErrors.BadRequest('Can\'t change the serviceReaction of a reaction');

            let controller;
            try {
                controller = await this.resolveReactionController(reaction.serviceReaction);
            } catch (e) {
                throw new HttpErrors.BadRequest('Reaction not found');
            }

            try {
                if (data.options) {
                    result = await controller.updateReaction(reaction.id!, reaction.options, data.options, this.ctx);
                } else {
                    if (data.data)
                        result = {success: true, options: reaction.options, data: data.data};
                    else
                        result = {success: true, options: reaction.options, data: reaction.data};
                }
            } catch (e) {
                throw new HttpErrors.BadRequest('Failed to update reaction in service');
            }
            if (!result.success) {
                throw new HttpErrors.BadRequest(result.error);
            }
        }
        return result;
    }

    async beforeCreate(reaction: PartialReaction, options?: AnyObject) : Promise<OperationStatus> {
        const areaRepository : AreaRepository = await this.ctx.get('repositories.AreaRepository');
        const userRepository : UserRepository = await this.ctx.get('repositories.UserRepository');
        const userEmail = (await areaRepository.findById(reaction.areaId)).ownerId;
        const user = await userRepository.findOne({
            where: {
                email: userEmail
            }
        });

        if (!user)
            throw new HttpErrors.InternalServerError('Failed to resolve user');
        let controller;
        try {
            controller = await this.resolveReactionController(reaction.serviceReaction!);
        } catch (e) {
            throw new HttpErrors.BadRequest('Reaction not found');
        }
        let result : OperationStatus;
        try {
            result = await controller.createReaction(user.id!, reaction.options, this.ctx);
        } catch (e) {
            throw new HttpErrors.BadRequest('Failed to create reaction in service');
        }
        if (!result.success) {
            throw new HttpErrors.BadRequest(result.error);
        }
        return result;
    }


    async beforeDelete(where?: WhereOrIdReaction, options?: AnyObject) : Promise<OperationStatus> {
        const reactions = await this.getByWhereOrId(where, options);
        let result : OperationStatus = {success: true};
        for (const reaction of reactions) {
            let controller;
            try {
                controller = await this.resolveReactionController(reaction.serviceReaction);
            // eslint-disable-next-line no-empty
            } catch (e) {
            }

            try {
                result = await controller.deleteReaction(reaction.id!, reaction.options, this.ctx);
            // eslint-disable-next-line no-empty
            } catch (e) {
            }
            if (!result.success) {
                throw new HttpErrors.BadRequest(result.error);
            }
        }
        return result;
    }

    deleteById(id: typeof Reaction.prototype.id, options?: AnyObject): Promise<void> {
        return this.beforeDelete(id, options).then(() => {
            return super.deleteById(id, options);
        }).catch((err) => {
            throw err;
        });
    }

    deleteAll(where?: FilterReaction, options?: AnyObject): Promise<Count> {
        return this.beforeDelete(where, options).then(() => {
            return super.deleteAll(where as FilterReaction, options);
        }).catch((err) => {
            throw err;
        });
    }

    updateAll(data: PartialReaction | Reaction, where?: FilterReaction, options?: AnyObject): Promise<Count> {
        return this.beforeUpdate(data, where, options).then((operationStatus: OperationStatus) => {
            data.options = operationStatus.options;
            return super.updateAll(data, where as FilterReaction, options);
        }).catch((err) => {
            throw err;
        });
    }

    updateById(id: typeof Reaction.prototype.id, data: PartialReaction | Reaction, options?: AnyObject): Promise<void> {
        return super.updateById(id, data, options);
    }

    create(entity: PartialReaction | Reaction, options?: AnyObject): Promise<Reaction> {
        return this.beforeCreate(entity, options).then((operationStatus: OperationStatus) => {
            entity.options = operationStatus.options;
            return super.create(entity, options);
        }).catch((err) => {
            throw err;
        });
    }
}

import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
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

    async beforeUpdate(where?: WhereOrIdReaction, options?: AnyObject) : Promise<void> {
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
}

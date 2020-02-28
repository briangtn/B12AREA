import {
    DefaultCrudRepository,
    repository,
    HasManyRepositoryFactory,
    HasOneRepositoryFactory, AnyObject, Condition, AndClause, OrClause, Count
} from '@loopback/repository';
import {Area, AreaRelations, Reaction, Action, User} from '../models';
import {MongoDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {ReactionRepository} from './reaction.repository';
import {ActionRepository} from './action.repository';
import {HttpErrors} from "@loopback/rest/dist";
import {UserProfile} from "@loopback/security";
import {UserRepository} from "./user.repository";

export class AreaRepository extends DefaultCrudRepository<Area,
    typeof Area.prototype.id,
    AreaRelations> {

    public readonly reactions: HasManyRepositoryFactory<Reaction, typeof Area.prototype.id>;

    public readonly action: HasOneRepositoryFactory<Action, typeof Area.prototype.id>;
    public readonly user: BelongsToAccessor<
        User,
        typeof Area.prototype.id
    >;

    constructor(
        @inject('datasources.mongo') dataSource: MongoDataSource,
        @repository.getter('ReactionRepository') protected reactionRepositoryGetter: Getter<ReactionRepository>,
        @repository.getter('ActionRepository') protected actionRepositoryGetter: Getter<ActionRepository>,
        @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>,
    ) {
        super(Area, dataSource);
        this.action = this.createHasOneRepositoryFactoryFor('action', actionRepositoryGetter,);
        this.registerInclusionResolver('action', this.action.inclusionResolver);
        this.reactions = this.createHasManyRepositoryFactoryFor('reactions', reactionRepositoryGetter,);
        this.registerInclusionResolver('reactions', this.reactions.inclusionResolver);
        this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter);
        this.registerInclusionResolver('user', this.user.inclusionResolver);
    }

    checkArea(area: Area | null, user: UserProfile): void {
        if (area === null || area?.ownerId !== user.email) {
            throw new HttpErrors.NotFound(`Area not found`);
        }
    }

    deleteById(id: typeof Area.prototype.id, options?: AnyObject): Promise<void> {
        return new Promise((resolve, reject) => {
            this.action(id).delete().then(() => {
            }).catch((err) => {
                reject(err);
            });
            this.reactions(id).delete().then(() => {
            }).catch((err) => {
                reject(err);
            });
            super.deleteById(id, options).then(() => {
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
    }

    async deleteAll(where?: Condition<Area> | AndClause<Area> | OrClause<Area>, options?: AnyObject): Promise<Count> {
        const areas = await this.find({
            where: where
        }, options);
        areas.forEach((area) => {
            this.action(area.id).delete().then().catch(console.error);
            this.reactions(area.id).delete().then().catch(console.error);
        });
        return super.deleteAll(where, options);
    }
}

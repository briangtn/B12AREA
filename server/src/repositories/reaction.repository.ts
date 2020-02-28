import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {Area, Reaction, ReactionRelations} from '../models';
import {MongoDataSource} from '../datasources';
import {Getter, inject} from '@loopback/core';
import {UserRepository} from "./user.repository";
import {AreaRepository} from "./area.repository";

export class ReactionRepository extends DefaultCrudRepository<Reaction,
    typeof Reaction.prototype.id,
    ReactionRelations> {

    public readonly area: BelongsToAccessor<
        Area,
        typeof Reaction.prototype.id
        >;

    constructor(
        @inject('datasources.mongo') dataSource: MongoDataSource,
        @repository(UserRepository) public userRepository: UserRepository,
        @repository.getter('AreaRepository') areaRepositoryGetter: Getter<AreaRepository>,
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
}

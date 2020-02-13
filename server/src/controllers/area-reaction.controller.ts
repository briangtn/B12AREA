import {
    Count,
    CountSchema,
    Filter,
    repository,
    Where,
} from '@loopback/repository';
import {
    api,
    del,
    get,
    getModelSchemaRef,
    getWhereSchemaFor,
    param,
    patch,
    post,
    requestBody,
} from '@loopback/rest';
import {
    Area,
    Reaction,
} from '../models';
import {AreaRepository, ReactionRepository} from '../repositories';
import {inject} from "@loopback/context";
import {SecurityBindings, UserProfile} from "@loopback/security";
import {authenticate} from "@loopback/authentication";
import {response200Schema} from "./specs/doc.specs";
import {NewReactionInArea} from "./specs/area.specs";
import {HttpErrors} from "@loopback/rest/dist";

@authenticate('jwt-all')
@api({basePath: '/areas', paths: {}})
export class AreaReactionController {
    constructor(
        @repository(AreaRepository) protected areaRepository: AreaRepository,
        @repository(ReactionRepository) protected reactionRepository: ReactionRepository,
        @inject(SecurityBindings.USER) private user: UserProfile,
    ) {
    }

    @get('/{id}/reactions', {
        responses: {
            '200': response200Schema({
                type: 'array',
                items: getModelSchemaRef(Reaction)
            }, 'Array of Reaction\'s belonging to Area'),
        },
    })
    async find(
        @param.path.string('id') id: string,
        @param.query.object('filter') filter?: Filter<Reaction>,
    ): Promise<Reaction[]> {
        const area = await this.areaRepository.findById(id, filter);
        this.areaRepository.checkArea(area, this.user);

        return this.areaRepository.reactions(id).find(filter);
    }

    @get('/{areaId}/reactions/{reactionId}', {
        responses: {
            '200': response200Schema({
                type: 'array',
                items: getModelSchemaRef(Reaction)
            }, 'Array of Reaction\'s belonging to Area'),
        },
    })
    async findOne(
        @param.path.string('areaId') areaId: string,
        @param.path.string('reactionId') reactionId: string,
        @param.query.object('filter') filter?: Filter<Reaction>,
    ): Promise<Reaction> {
        const area = await this.areaRepository.findById(areaId, filter);
        this.areaRepository.checkArea(area, this.user);

        return this.reactionRepository.findById(reactionId, {
            where: {
                areaId: areaId
            }
        });
    }

    @post('/{id}/reactions', {
        responses: {
            '200': response200Schema(getModelSchemaRef(Reaction), 'Area model instance'),
        },
    })
    async create(
        @param.path.string('id') id: typeof Area.prototype.id,
        @requestBody(NewReactionInArea) reaction: Omit<Reaction, 'id'>,
    ): Promise<Reaction> {
        const area = await this.areaRepository.findById(id);
        this.areaRepository.checkArea(area, this.user);

        return this.areaRepository.reactions(id).create(reaction);
    }

    @patch('/{id}/reactions/{reactionId}', {
        responses: {
            '200': response200Schema(CountSchema, 'Area.Reaction PATCH success count'),
        },
    })
    async patch(
        @param.path.string('id') id: string,
        @param.path.string('reactionId') reactionId: string,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(Reaction, {partial: true}),
                },
            },
        })
            reaction: Partial<Reaction>,
        @param.query.object('where', getWhereSchemaFor(Reaction)) where?: Where<Reaction>,
    ): Promise<Reaction> {
        const area = await this.areaRepository.findById(id);
        this.areaRepository.checkArea(area, this.user);

        await this.areaRepository.reactions(id).patch(reaction, {
            id: reactionId,
            and: where
        });
        return this.reactionRepository.findById(reactionId);
    }

    @del('/{id}/reactions/{reactionId}', {
        responses: {
            '200': response200Schema(CountSchema, 'Area.Reaction DELETE success count'),
        },
    })
    async delete(
        @param.path.string('id') id: string,
        @param.path.string('reactionId') reactionId: string,
        @param.query.object('where', getWhereSchemaFor(Reaction)) where?: Where<Reaction>,
    ): Promise<Count> {
        const area = await this.areaRepository.findById(id);
        this.areaRepository.checkArea(area, this.user);

        const count = await this.reactionRepository.count({
            areaId: id,
            id: reactionId,
            and: where
        });
        if (count.count <= 0)
            throw new HttpErrors.NotFound("Reaction not found");
        return this.areaRepository.reactions(id).delete({
            id: reactionId,
            and: where
        });
    }
}

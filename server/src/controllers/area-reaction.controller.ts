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
    Reaction, User,
} from '../models';
import {AreaRepository, ReactionRepository, UserRepository} from '../repositories';
import {Context, inject} from "@loopback/context";
import {SecurityBindings, UserProfile} from "@loopback/security";
import {authenticate} from "@loopback/authentication";
import {response200Schema} from "./specs/doc.specs";
import {NewReactionInArea} from "./specs/area.specs";
import {HttpErrors} from "@loopback/rest/dist";
import {OperationStatus} from "../services-interfaces";
import {OPERATION_SECURITY_SPEC} from "../utils/security-specs";

@authenticate('jwt-all')
@api({basePath: '/areas', paths: {}})
export class AreaReactionController {
    constructor(
        @repository(UserRepository) protected userRepository: UserRepository,
        @repository(AreaRepository) protected areaRepository: AreaRepository,
        @repository(ReactionRepository) protected reactionRepository: ReactionRepository,
        @inject(SecurityBindings.USER) private user: UserProfile,
        @inject.context() private ctx: Context,
    ) {
    }

    private async resolveUserFromUserProfile(user: UserProfile) : Promise<User | null> {
        try {
            return await this.userRepository.getFromUserProfile(user);
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

    @get('/{id}/reactions', {
        security: OPERATION_SECURITY_SPEC,
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
        security: OPERATION_SECURITY_SPEC,
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
        security: OPERATION_SECURITY_SPEC,
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

        let user : User | null = null;
        try {
            user = await this.resolveUserFromUserProfile(this.user);
        } catch (e) {
            throw new HttpErrors.InternalServerError('Failed to resolve user');
        }
        if (!user)
            throw new HttpErrors.InternalServerError('Failed to resolve user');
        let controller;
        try {
            controller = await this.resolveReactionController(reaction.serviceReaction);
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
        reaction.options = result.options;

        return this.areaRepository.reactions(id).create(reaction);
    }

    @patch('/{id}/reactions/{reactionId}', {
        security: OPERATION_SECURITY_SPEC,
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

        const dbReaction = await this.reactionRepository.findById(reactionId);

        let controller;
        try {
            controller = await this.resolveReactionController(dbReaction.serviceReaction);
        } catch (e) {
            throw new HttpErrors.BadRequest('Reaction not found');
        }

        let result : OperationStatus;
        try {
            result = await controller.updateReaction(dbReaction.id!, dbReaction.options, reaction.options, this.ctx);
        } catch (e) {
            throw new HttpErrors.BadRequest('Failed to update action in service');
        }
        if (!result.success) {
            throw new HttpErrors.BadRequest(result.error);
        }
        reaction.options = result.options;

        await this.areaRepository.reactions(id).patch(reaction, {
            id: reactionId,
            and: where
        });
        return this.reactionRepository.findById(reactionId);
    }

    @del('/{id}/reactions/{reactionId}', {
        security: OPERATION_SECURITY_SPEC,
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

        const dbReaction = await this.reactionRepository.findById(reactionId);

        let controller;
        try {
            controller = await this.resolveReactionController(dbReaction.serviceReaction);
        } catch (e) {
            throw new HttpErrors.BadRequest('Reaction not found');
        }

        let result : OperationStatus;
        try {
            result = await controller.deleteReaction(dbReaction.id!, dbReaction.options, this.ctx);
        } catch (e) {
            throw new HttpErrors.BadRequest('Failed to update action in service');
        }
        if (!result.success) {
            throw new HttpErrors.BadRequest(result.error);
        }

        return this.areaRepository.reactions(id).delete({
            id: reactionId,
            and: where
        });
    }
}

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
import {AreaRepository} from '../repositories';
import {inject} from "@loopback/context";
import {SecurityBindings, UserProfile} from "@loopback/security";
import {authenticate} from "@loopback/authentication";
import {response200Schema} from "./specs/doc.specs";
import {NewReactionInArea} from "./specs/area.specs";

@authenticate('jwt-all')
@api({basePath: '/areas', paths: {}})
export class AreaReactionController {
    constructor(
        @repository(AreaRepository) protected areaRepository: AreaRepository,
        @inject(SecurityBindings.USER) private user: UserProfile,
    ) {
    }

    @get('/{id}/reactions', {
        responses: {
            '200': response200Schema({type: 'array', items: getModelSchemaRef(Reaction)},'Array of Reaction\'s belonging to Area'),
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
        //todo: check if reaction exist and call the reaction create method, also assign config to the returned config / abort if unsuccessful
        return this.areaRepository.reactions(id).create(reaction);
    }

    @patch('/{id}/reactions', {
        responses: {
            '200': response200Schema(CountSchema, 'Area.Reaction PATCH success count'),
        },
    })
    async patch(
        @param.path.string('id') id: string,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(Reaction, {partial: true}),
                },
            },
        })
            reaction: Partial<Reaction>,
        @param.query.object('where', getWhereSchemaFor(Reaction)) where?: Where<Reaction>,
    ): Promise<Count> {
        const area = await this.areaRepository.findById(id);
        this.areaRepository.checkArea(area, this.user);
        //todo: check if reaction exist and call the reaction patch method, also assign config to the returned config / abort if unsuccessful
        return this.areaRepository.reactions(id).patch(reaction, where);
    }

    @del('/{id}/reactions', {
        responses: {
            '200': response200Schema(CountSchema, 'Area.Reaction DELETE success count'),
        },
    })
    async delete(
        @param.path.string('id') id: string,
        @param.query.object('where', getWhereSchemaFor(Reaction)) where?: Where<Reaction>,
    ): Promise<Count> {
        const area = await this.areaRepository.findById(id);
        this.areaRepository.checkArea(area, this.user);
        //todo: check if reaction exist and call the reaction delete method, abort if unsuccessful
        return this.areaRepository.reactions(id).delete(where);
    }
}

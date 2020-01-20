import {
    Count,
    CountSchema,
    Filter,
    repository,
    Where,
} from '@loopback/repository';
import {
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

export class AreaReactionController {
    constructor(
        @repository(AreaRepository) protected areaRepository: AreaRepository,
    ) {
    }

    @get('/areas/{id}/reactions', {
        responses: {
            '200': {
                description: 'Array of Reaction\'s belonging to Area',
                content: {
                    'application/json': {
                        schema: {type: 'array', items: getModelSchemaRef(Reaction)},
                    },
                },
            },
        },
    })
    async find(
        @param.path.string('id') id: string,
        @param.query.object('filter') filter?: Filter<Reaction>,
    ): Promise<Reaction[]> {
        return this.areaRepository.reactions(id).find(filter);
    }

    @post('/areas/{id}/reactions', {
        responses: {
            '200': {
                description: 'Area model instance',
                content: {'application/json': {schema: getModelSchemaRef(Reaction)}},
            },
        },
    })
    async create(
        @param.path.string('id') id: typeof Area.prototype.id,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(Reaction, {
                        title: 'NewReactionInArea',
                        exclude: ['id'],
                        optional: ['areaId']
                    }),
                },
            },
        }) reaction: Omit<Reaction, 'id'>,
    ): Promise<Reaction> {
        return this.areaRepository.reactions(id).create(reaction);
    }

    @patch('/areas/{id}/reactions', {
        responses: {
            '200': {
                description: 'Area.Reaction PATCH success count',
                content: {'application/json': {schema: CountSchema}},
            },
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
        return this.areaRepository.reactions(id).patch(reaction, where);
    }

    @del('/areas/{id}/reactions', {
        responses: {
            '200': {
                description: 'Area.Reaction DELETE success count',
                content: {'application/json': {schema: CountSchema}},
            },
        },
    })
    async delete(
        @param.path.string('id') id: string,
        @param.query.object('where', getWhereSchemaFor(Reaction)) where?: Where<Reaction>,
    ): Promise<Count> {
        return this.areaRepository.reactions(id).delete(where);
    }
}

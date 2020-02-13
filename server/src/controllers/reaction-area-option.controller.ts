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
    Reaction,
    AreaOption,
} from '../models';
import {ReactionRepository} from '../repositories';

export class ReactionAreaOptionController {
    constructor(
        @repository(ReactionRepository) protected reactionRepository: ReactionRepository,
    ) {
    }

    @get('/reactions/{id}/area-options', {
        responses: {
            '200': {
                description: 'Array of Reaction has many AreaOption',
                content: {
                    'application/json': {
                        schema: {type: 'array', items: getModelSchemaRef(AreaOption)},
                    },
                },
            },
        },
    })
    async find(
        @param.path.string('id') id: string,
        @param.query.object('filter') filter?: Filter<AreaOption>,
    ): Promise<AreaOption[]> {
        return this.reactionRepository.options(id).find(filter);
    }

    @post('/reactions/{id}/area-options', {
        responses: {
            '200': {
                description: 'Reaction model instance',
                content: {'application/json': {schema: getModelSchemaRef(AreaOption)}},
            },
        },
    })
    async create(
        @param.path.string('id') id: typeof Reaction.prototype.id,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(AreaOption, {
                        title: 'NewAreaOptionInReaction',
                        exclude: ['id'],
                        optional: ['reactionId']
                    }),
                },
            },
        }) areaOption: Omit<AreaOption, 'id'>,
    ): Promise<AreaOption> {
        return this.reactionRepository.options(id).create(areaOption);
    }

    @patch('/reactions/{id}/area-options', {
        responses: {
            '200': {
                description: 'Reaction.AreaOption PATCH success count',
                content: {'application/json': {schema: CountSchema}},
            },
        },
    })
    async patch(
        @param.path.string('id') id: string,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(AreaOption, {partial: true}),
                },
            },
        })
            areaOption: Partial<AreaOption>,
        @param.query.object('where', getWhereSchemaFor(AreaOption)) where?: Where<AreaOption>,
    ): Promise<Count> {
        return this.reactionRepository.options(id).patch(areaOption, where);
    }

    @del('/reactions/{id}/area-options', {
        responses: {
            '200': {
                description: 'Reaction.AreaOption DELETE success count',
                content: {'application/json': {schema: CountSchema}},
            },
        },
    })
    async delete(
        @param.path.string('id') id: string,
        @param.query.object('where', getWhereSchemaFor(AreaOption)) where?: Where<AreaOption>,
    ): Promise<Count> {
        return this.reactionRepository.options(id).delete(where);
    }
}

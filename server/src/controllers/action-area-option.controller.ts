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
    Action,
    AreaOption,
} from '../models';
import {ActionRepository} from '../repositories';

export class ActionAreaOptionController {
    constructor(
        @repository(ActionRepository) protected actionRepository: ActionRepository,
    ) {
    }

    @get('/actions/{id}/area-options', {
        responses: {
            '200': {
                description: 'Array of Action has many AreaOption',
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
        return this.actionRepository.options(id).find(filter);
    }

    @post('/actions/{id}/area-options', {
        responses: {
            '200': {
                description: 'Action model instance',
                content: {'application/json': {schema: getModelSchemaRef(AreaOption)}},
            },
        },
    })
    async create(
        @param.path.string('id') id: typeof Action.prototype.id,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(AreaOption, {
                        title: 'NewAreaOptionInAction',
                        exclude: ['id'],
                        optional: ['actionId']
                    }),
                },
            },
        }) areaOption: Omit<AreaOption, 'id'>,
    ): Promise<AreaOption> {
        return this.actionRepository.options(id).create(areaOption);
    }

    @patch('/actions/{id}/area-options', {
        responses: {
            '200': {
                description: 'Action.AreaOption PATCH success count',
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
        return this.actionRepository.options(id).patch(areaOption, where);
    }

    @del('/actions/{id}/area-options', {
        responses: {
            '200': {
                description: 'Action.AreaOption DELETE success count',
                content: {'application/json': {schema: CountSchema}},
            },
        },
    })
    async delete(
        @param.path.string('id') id: string,
        @param.query.object('where', getWhereSchemaFor(AreaOption)) where?: Where<AreaOption>,
    ): Promise<Count> {
        return this.actionRepository.options(id).delete(where);
    }
}

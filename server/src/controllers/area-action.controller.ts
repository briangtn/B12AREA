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
    Action,
} from '../models';
import {AreaRepository} from '../repositories';

export class AreaActionController {
    constructor(
        @repository(AreaRepository) protected areaRepository: AreaRepository,
    ) {
    }

    @get('/areas/{id}/action', {
        responses: {
            '200': {
                description: 'Action belonging to Area',
                content: {
                    'application/json': {
                        schema: getModelSchemaRef(Action),
                    },
                },
            },
        },
    })
    async find(
        @param.path.string('id') id: string,
        @param.query.object('filter') filter?: Filter<Action>,
    ): Promise<Action> {
        return this.areaRepository.action(id).get(filter);
    }

    //TODO Conflict if already exists
    @post('/areas/{id}/action', {
        responses: {
            '200': {
                description: 'Area model instance',
                content: {'application/json': {schema: getModelSchemaRef(Action)}},
            },
        },
    })
    async create(
        @param.path.string('id') id: typeof Area.prototype.id,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(Action, {
                        title: 'NewActionInArea',
                        exclude: ['id'],
                        optional: ['areaId']
                    }),
                },
            },
        }) action: Omit<Action, 'id'>,
    ): Promise<Action> {
        throw Error("TODO");
        //return this.areaRepository.action(id).create(action);
    }

    @patch('/areas/{id}/action', {
        responses: {
            '200': {
                description: 'Area.Action PATCH success count',
                content: {'application/json': {schema: CountSchema}},
            },
        },
    })
    async patch(
        @param.path.string('id') id: string,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(Action, {partial: true}),
                },
            },
        })
            action: Partial<Action>,
        @param.query.object('where', getWhereSchemaFor(Action)) where?: Where<Action>,
    ): Promise<Count> {
        return this.areaRepository.action(id).patch(action, where);
    }

    @del('/areas/{id}/action', {
        responses: {
            '200': {
                description: 'Area.Action DELETE success count',
                content: {'application/json': {schema: CountSchema}},
            },
        },
    })
    async delete(
        @param.path.string('id') id: string,
        @param.query.object('where', getWhereSchemaFor(Action)) where?: Where<Action>,
    ): Promise<Count> {
        return this.areaRepository.action(id).delete(where);
    }
}

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
    User,
    Area,
} from '../models';
import {UserRepository} from '../repositories';
import {response200Schema} from "./specs/doc.specs";
import {authenticate} from "@loopback/authentication";
import {SecurityBindings, UserProfile} from "@loopback/security";
import {inject} from "@loopback/context";
import {OPERATION_SECURITY_SPEC} from "../utils/security-specs";
import {NewArea} from "./specs/area.specs";

@authenticate('jwt-all')
export class UserAreaController {
    constructor(
        @repository(UserRepository) protected userRepository: UserRepository,
        @inject(SecurityBindings.USER) private user: UserProfile
    ) {
    }

    @get('/users/{id}/areas', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': response200Schema({type: 'array', items: getModelSchemaRef(Area)}, 'Array of Area\'s belonging to User'),
        },
    })
    async find(
        @param.path.string('id') id: string,
        @param.query.object('filter') filter?: Filter<Area>,
    ): Promise<Area[]> {
        return this.userRepository.areas(id).find(filter);
    }

    @post('/users/{id}/areas', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': {
                description: 'User model instance',
                content: {'application/json': {schema: getModelSchemaRef(Area)}},
            },
        },
    })
    async create(
        @param.path.string('id') id: typeof User.prototype.id,
        @requestBody(NewArea) area: Omit<Area, 'id'>,
    ): Promise<Area> {
        return this.userRepository.areas(id).create(area);
    }

    @patch('/users/{id}/areas', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': {
                description: 'User.Area PATCH success count',
                content: {'application/json': {schema: CountSchema}},
            },
        },
    })
    async patch(
        @param.path.string('id') id: string,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(Area, {partial: true}),
                },
            },
        })
            area: Partial<Area>,
        @param.query.object('where', getWhereSchemaFor(Area)) where?: Where<Area>,
    ): Promise<Count> {
        return this.userRepository.areas(id).patch(area, where);
    }

    @del('/users/{id}/areas', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': {
                description: 'User.Area DELETE success count',
                content: {'application/json': {schema: CountSchema}},
            },
        },
    })
    async delete(
        @param.path.string('id') id: string,
        @param.query.object('where', getWhereSchemaFor(Area)) where?: Where<Area>,
    ): Promise<Count> {
        return this.userRepository.areas(id).delete(where);
    }
}

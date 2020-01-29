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
    requestBody, RestBindings,
} from '@loopback/rest';
import {
    Area,
    Action,
} from '../models';
import {AreaRepository} from '../repositories';
import {authenticate} from "@loopback/authentication";
import {OPERATION_SECURITY_SPEC} from "../utils/security-specs";
import {response200Schema} from "./specs/doc.specs";
import {inject} from "@loopback/context";
import {SecurityBindings, UserProfile} from "@loopback/security";
import {NewActionInArea} from "./specs/area.specs";
import {HttpErrors} from "@loopback/rest/dist";

@authenticate('jwt-all')
@api({basePath: '/areas', paths: {}})
export class AreaActionController {
    constructor(
        @repository(AreaRepository) protected areaRepository: AreaRepository,
        @inject(SecurityBindings.USER) private user: UserProfile,
    ) {
    }

    @get('/{id}/action', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': response200Schema(getModelSchemaRef(Action), 'Action belonging to Area'),
        },
    })
    async find(
        @param.path.string('id') id: string,
        @param.query.object('filter') filter?: Filter<Action>,
    ): Promise<Action> {
        const area = await this.areaRepository.findById(id, filter);
        this.areaRepository.checkArea(area, this.user);
        return this.areaRepository.action(id).get(filter);
    }

    @post('/{id}/action', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': response200Schema(getModelSchemaRef(Action), 'Area model instance'),
        },
    })
    async create(
        @param.path.string('id') id: typeof Area.prototype.id,
        @requestBody(NewActionInArea) action: Omit<Action, 'id'>,
    ): Promise<Action> {
        const area = await this.areaRepository.findById(id);
        this.areaRepository.checkArea(area, this.user);

        if (area.action)
            throw new HttpErrors.Conflict("Action already exists for this area");
        return this.areaRepository.action(id).create(action);
    }

    @patch('/{id}/action', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': response200Schema(CountSchema, 'Area.Action PATCH success count')
        }
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
        const area = await this.areaRepository.findById(id);
        this.areaRepository.checkArea(area, this.user);

        return this.areaRepository.action(id).patch(action, where);
    }

    @del('/{id}/action', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': response200Schema(CountSchema, 'Area.Action DELETE success count'),
        },
    })
    async delete(
        @param.path.string('id') id: string,
        @param.query.object('where', getWhereSchemaFor(Action)) where?: Where<Action>,
    ): Promise<Count> {
        const area = await this.areaRepository.findById(id);
        this.areaRepository.checkArea(area, this.user);

        return this.areaRepository.action(id).delete(where);
    }
}

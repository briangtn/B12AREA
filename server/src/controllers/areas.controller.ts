import {
    post,
    param,
    get,
    getFilterSchemaFor,
    getModelSchemaRef,
    getWhereSchemaFor,
    patch,
    put,
    del,
    requestBody, api,
} from '@loopback/rest';
import {authenticate} from "@loopback/authentication";
import {SecurityBindings, UserProfile} from "@loopback/security";
import {inject} from "@loopback/context";
import {Area, AreaWithRelations} from "../models";
import {NewArea, PatchArea} from "./specs/area.specs";
import {Count, CountSchema, Filter, repository, Where} from "@loopback/repository";
import {AreaRepository, UserRepository} from "../repositories";
import {OPERATION_SECURITY_SPEC} from "../utils/security-specs";
import {response200Schema, response204} from "./specs/doc.specs";
import {HttpErrors} from "@loopback/rest/dist";

@authenticate('jwt-all')
@api({basePath: '/areas', paths: {}})
export class AreasController {
    constructor(
        @inject(SecurityBindings.USER) private user: UserProfile,
        @repository(UserRepository) protected userRepository: UserRepository,
        @repository(AreaRepository) protected areaRepository: AreaRepository
    ) {
    }

    @get('/', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': response200Schema({type: 'array', items: getModelSchemaRef(Area)}, 'List of user\'s Areas')
        },
    })
    async getAreas(
        @param.query.object('filter', getFilterSchemaFor(Area)) filter?: Filter<Area>
    ): Promise<Area[]> {
        return this.areaRepository.find({where: {ownerId: this.user.email, and: filter}});
    }

    @post('/', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': response200Schema(getModelSchemaRef(Area), 'Area model instance')
        },
    })
    create(
        @requestBody(NewArea) area: Omit<Area, 'id'>
    ) {
        return this.userRepository.createArea(this.user.email, area);
    }

    @get('/count', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': response200Schema(CountSchema, 'Area model count')
        },
    })
    async count(
        @param.query.object('where', getWhereSchemaFor(Area)) where?: Where<Area>,
    ): Promise<Count> {
        return this.areaRepository.count({ownerId: this.user.email, and: where});
    }

    @get('/{id}', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': response200Schema(getModelSchemaRef(Area), 'Specific Area')
        },
    })
    async getArea(
        @param.path.string('id') id: string,
    ) {
        const area = await this.areaRepository.findOne({where: {ownerId: this.user.email, id: id}});
        this.areaRepository.checkArea(area, this.user);

        return area;
    }

    @patch('/{id}', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': response200Schema(getModelSchemaRef(Area), 'Area model instance')
        },
    })
    async update(
        @param.path.string('id') id: string,
        @requestBody(PatchArea) areaPatch: Partial<Area>,
    ) {
        this.getArea(id).catch((e) => {
            throw e
        });
        await this.areaRepository.updateById(id, areaPatch);
    }

    @del('/{id}', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '204': response204('Area DELETE success')
        },
    })
    async deleteById(@param.path.string('id') id: string): Promise<void> {
        this.getArea(id).catch((e) => {
            throw e
        });
        await this.areaRepository.deleteById(id);
    }

    @patch('/enable/{id}')
    async enable(
        @param.path.string('id')
            id: string
    ) {
        return this.enableDisableArea(id, true);
    }

    @patch('/disable/{id}')
    async disable(
        @param.path.string('id')
            id: string
    ) {
        return this.enableDisableArea(id, false);
    }

    async enableDisableArea(id: string, status: boolean): Promise<void> {
        const area = await this.getArea(id);
        this.areaRepository.checkArea(area, this.user);

        return this.areaRepository.updateById(id, {
            enabled: true
        });
    }
}
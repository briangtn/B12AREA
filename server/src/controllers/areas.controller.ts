import {api, del, get, getModelSchemaRef, param, patch, post, requestBody} from '@loopback/rest';
import {authenticate} from "@loopback/authentication";
import {SecurityBindings, UserProfile} from "@loopback/security";
import {inject} from "@loopback/context";
import {Area} from "../models";
import {NewArea} from "./specs/area.specs";
import {repository} from "@loopback/repository";
import {AreaRepository, UserRepository} from "../repositories";
import {OPERATION_SECURITY_SPEC} from "../utils/security-specs";
import {response200Schema} from "./specs/doc.specs";

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
    async getAreas() {
        return this.areaRepository.find({where: {ownerId: this.user.email}});
    }

    @get('/{id}')
    getArea(
        @param.path.string('id') id: string
    ) {

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

    @patch('/{id}')
    update() {

    }

    @del('/{id}')
    delete() {

    }

    @patch('/enable/{id}')
    enable(
        @param.path.string('id')
            id: string
    ) {
    }

    @patch('/disable/{id}')
    disable(
        @param.path.string('id')
            id: string
    ) {
    }

    @get('/actions/{area_id}')
    getActions(
        @param.path.string('area_id')
            areaId: string
    ) {

    }

    @get('/reactions/{area_id}')
    getReactions(
        @param.path.string('area_id')
            areadId: string
    ) {

    }

}


import {
    Count,
    CountSchema,
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
    requestBody, Response, RestBindings,
} from '@loopback/rest';
import {
    Area,
    Action, User,
} from '../models';
import {ActionRepository, AreaRepository, UserRepository} from '../repositories';
import {authenticate} from "@loopback/authentication";
import {OPERATION_SECURITY_SPEC} from "../utils/security-specs";
import {response200Schema} from "./specs/doc.specs";
import {Context, inject} from "@loopback/context";
import {SecurityBindings, UserProfile} from "@loopback/security";
import {NewActionInArea} from "./specs/area.specs";
import {HttpErrors} from "@loopback/rest/dist";
import {constants} from "http2";
import {OperationStatus} from "../services-interfaces";

@authenticate('jwt-all')
@api({basePath: '/areas', paths: {}})
export class AreaActionController {
    constructor(
        @repository(UserRepository) protected userRepository: UserRepository,
        @repository(AreaRepository) protected areaRepository: AreaRepository,
        @repository(ActionRepository) protected actionRepository: ActionRepository,
        @inject(SecurityBindings.USER) private user: UserProfile,
        @inject(RestBindings.Http.RESPONSE) protected response: Response,
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

    private async resolveActionController(actionType: string) {
        const serviceName = actionType.split('.')[0];
        const actionName = actionType.split('.')[2];

        const module = await import(`../area-services/${serviceName}/actions/${actionName}/controller`);
        return module.default;
    }

    @get('/{id}/action', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': response200Schema(getModelSchemaRef(Action), 'Action belonging to Area'),
        },
    })
    async find(
        @param.path.string('id') id: string,
    ): Promise<Action> {
        const area = await this.areaRepository.findById(id, {
            include: [{
                relation: 'action'
            }]
        });
        this.areaRepository.checkArea(area, this.user);

        if (!area.action) {
            this.response.status(constants.HTTP_STATUS_NO_CONTENT);
            return {} as Action;
        }
        return area.action;
    }

    @post('/{id}/action', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': response200Schema(getModelSchemaRef(Action), 'Area model instance'),
        },
    })
    async create(
        @param.path.string('id') id: typeof Area.prototype.id,
        @requestBody(NewActionInArea) action: Omit<Omit<Action, 'data'>, 'id'>,
    ): Promise<Action> {
        const area = await this.areaRepository.findById(id, {
            include: [{
                relation: 'action'
            }],
        });
        this.areaRepository.checkArea(area, this.user);
        if (area.action)
            throw new HttpErrors.Conflict("Action already exists for this area");

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
            controller = await this.resolveActionController(action.serviceAction);
        } catch (e) {
            throw new HttpErrors.BadRequest('Action not found');
        }
        let result : OperationStatus;
        try {
            result = await controller.createAction(user.id!, action.options, this.ctx);
        } catch (e) {
            throw new HttpErrors.BadRequest('Failed to create action in service');
        }
        if (!result.success) {
            throw new HttpErrors.BadRequest(result.error);
        }
        action.options = result.options;
        action.data = {};
        if (result.data)
            action.data = result.data;

        const created = await this.areaRepository.action(id).create(action);

        if (controller.createActionFinished) {
            try {
                result = await controller.createActionFinished(created.id!, user.id!, action.options, this.ctx);
                if (!result.success)
                    throw new HttpErrors.BadRequest(result.error);
            } catch (e) {
                throw new HttpErrors.BadRequest('Failed to create action in service');
            }
        }
        return created;
    }

    @patch('/{id}/action', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': response200Schema(getModelSchemaRef(Action), 'Area model instance')
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
    ): Promise<Action> {
        const area = await this.areaRepository.findById(id, {
            include: [{
                relation: 'action'
            }],
        });
        this.areaRepository.checkArea(area, this.user);

        if (!area.action)
            throw new HttpErrors.BadRequest('Area does not have an action');

        let controller;
        try {
            controller = await this.resolveActionController(area.action.serviceAction);
        } catch (e) {
            // Dont put a NotFound error, the type of action is not found (not the entity)
            throw new HttpErrors.BadRequest('Action not found');
        }
        let result : OperationStatus;
        try {
            result = await controller.updateAction(area.action.id!, area.action.options, action.options, this.ctx);
        } catch (e) {
            throw new HttpErrors.BadRequest('Failed to update action in service');
        }
        if (!result.success) {
            throw new HttpErrors.BadRequest(result.error);
        }
        action.options = result.options;

        await this.areaRepository.action(id).patch(action, where);

        const updated = await this.areaRepository.action(id).get();

        if (controller.updateActionFinished) {
            try {
                result = await controller.updateActionFinished(updated.id!, (await this.actionRepository.getActionOwnerID(updated.id!))!, action.options, this.ctx);
                if (!result.success)
                    throw new HttpErrors.BadRequest(result.error);
            } catch (e) {
                throw new HttpErrors.BadRequest('Failed to create action in service');
            }
        }
        return updated;
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
        const area = await this.areaRepository.findById(id, {
            include: [{
                relation: 'action'
            }],
        });
        this.areaRepository.checkArea(area, this.user);

        if (!area.action)
            throw new HttpErrors.BadRequest('Area does not have an action');

        let controller;
        try {
            controller = await this.resolveActionController(area.action.serviceAction);
        } catch (e) {
            throw new HttpErrors.NotFound('Action not found');
        }
        let result : OperationStatus;
        try {
            result = await controller.deleteAction(area.action.id!, area.action.options, this.ctx);
        } catch (e) {
            throw new HttpErrors.BadRequest('Failed to update action in service');
        }
        if (!result.success) {
            throw new HttpErrors.BadRequest(result.error);
        }

        return this.areaRepository.action(id).delete(where);
    }
}
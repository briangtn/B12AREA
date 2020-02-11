import {RestBindings, post, param, api, HttpErrors} from '@loopback/rest';
import {Context, inject} from "@loopback/context";
import {LoginObject} from "../services-interfaces";
import {authenticate} from "@loopback/authentication";
import {OPERATION_SECURITY_SPEC} from "../utils/security-specs";
import {response200} from "./specs/doc.specs";
import {User} from "../models";
import {SecurityBindings, UserProfile} from "@loopback/security";

@api({basePath: '/services', paths: {}})
export class ServicesController {
    constructor(
        @inject.context() private ctx: Context
    ) {
    }

    @post('/login/{service_name}', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': {
                description: "Return a url to redirect to",
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                url: {
                                    type: 'string',
                                }
                            }
                        }
                    }
                }
            }
        },
    })
    @authenticate('jwt-all')
    async subscribe(
        @param.path.string('service_name') serviceName: string,
        @param.query.string('redirectURL') redirectURL: string,
        @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    ) {
        try {
            const module = await import('../area-services/' + serviceName + '/controller');
            const controller = module.default;
            const loginParams: LoginObject = {
                user: currentUserProfile,
                redirectUrl: redirectURL,
                ctx: this.ctx
            };
            const res = await controller.login(loginParams);
            return {url: res};
        } catch (e) {
            throw new HttpErrors.NotFound('Service not found');
        }
    }
}

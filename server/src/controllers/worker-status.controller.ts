import {RestBindings, Response, get} from '@loopback/rest';
import {inject} from '@loopback/context';
import {response200Schema} from "./specs/doc.specs";
import WorkerHelper from "../WorkerHelper";
import {OPERATION_SECURITY_SPEC} from "../utils/security-specs";
import {authenticate} from "@loopback/authentication";
import {authorize} from "@loopback/authorization";


export class WorkerStatusController {
    constructor(@inject(RestBindings.Http.RESPONSE) protected response: Response) {
    }

    @get('/admin/workers/jobs/status', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200':  response200Schema({
                type: 'object',
                properties: {
                    reactionQueue: {
                        type: 'object',
                        properties: {
                            waiting: {
                                type: 'number'
                            },
                            active: {
                                type: 'number'
                            },
                            completed: {
                                type: 'number'
                            },
                            failed: {
                                type: 'number'
                            },
                            delayed: {
                                type: 'number'
                            }
                        }
                    },
                    pullingQueue: {
                        type: 'object',
                        properties: {
                            waiting: {
                                type: 'number'
                            },
                            active: {
                                type: 'number'
                            },
                            completed: {
                                type: 'number'
                            },
                            failed: {
                                type: 'number'
                            },
                            delayed: {
                                type: 'number'
                            }
                        }
                    },
                    delayedQueue: {
                        type: 'object',
                        properties: {
                            waiting: {
                                type: 'number'
                            },
                            active: {
                                type: 'number'
                            },
                            completed: {
                                type: 'number'
                            },
                            failed: {
                                type: 'number'
                            },
                            delayed: {
                                type: 'number'
                            }
                        }
                    },
                }
            }, 'Jobs infos'),
        }
    })
    @authenticate('jwt-all')
    @authorize({allowedRoles: ['admin']})
    async getJobsStatus() {
        return WorkerHelper.GetJobInfosCount();
    }
}

import {RestBindings, Response, get, Request} from '@loopback/rest';
import {inject} from '@loopback/context';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import {
    ActionControllerInterface,
    ReactionControllerInterface,
    ServiceControllerInterface
} from "../services-interfaces";

const readdir = util.promisify(fs.readdir);

class Action {
    name: string;
    description: string;
}

class Reaction {
    name: string;
    description: string;
}

class Service {
    name: string;
    actions: Array<Action>;
    reactions: Array<Reaction>;
}

export class AboutController {
    constructor(
        @inject(RestBindings.Http.REQUEST) protected request: Request,
        @inject(RestBindings.Http.RESPONSE) protected response: Response
    ) {}

    @get('/about.json', {
        responses: {
            '200': {
                description: 'Return a json file containing informations'
            }
        }
    })
    async about(): Promise<Object> {
        return {
            client: {
                host: this.request.ip
            },
            server: {
                // eslint-disable-next-line @typescript-eslint/camelcase
                current_time: Math.floor(Date.now() / 1000),
                services: await this.parseServices()
            }
        }
    }

    async parseServices(): Promise<Array<Service>> {
        const services: Array<Service> = [];
        const servicesPath = path.join(__dirname, '../area-services/');
        let serviceDirs: Array<string> = [];
        try {
            serviceDirs = await readdir(servicesPath);
        } catch (e) {
            console.log('Unable to scan directory: ' + e);
            return services;
        }
        for (const serviceName of serviceDirs) {
            const newService = new Service;
            const serviceControllerPath = path.join(servicesPath, serviceName, serviceName + '.lb-controller.js');
            try {
                const {ServiceController} = require(serviceControllerPath);
                const controller: ServiceControllerInterface = new ServiceController();
                newService.name = controller.getConfig().displayName;
                newService.actions = [];
                newService.reactions = [];
            } catch (e) {
                if (e.code !== 'MODULE_NOT_FOUND') {
                    console.log('Error ', e.code, ' while loading ', serviceControllerPath);
                    continue;
                }
                console.log(`ServiceController could not be found in ${serviceControllerPath}`);
                continue;
            }
            const serviceActionsPath = path.join(servicesPath, serviceName, 'actions');
            let actionDirs: Array<string> = [];
            try {
                actionDirs = await readdir(serviceActionsPath);
            } catch (e) {
                console.log('Unable to scan directory: ' + e);
                continue;
            }
            for (const actionName of actionDirs) {
                const newAction = new Action;
                const actionControllerPath = path.join(serviceActionsPath, actionName, actionName + '.lb-controller.js');
                try {
                    const {ActionController} = require(actionControllerPath);
                    const controller: ActionControllerInterface = new ActionController();
                    newAction.name = controller.getConfig().displayName;
                    newAction.description = controller.getConfig().description;
                } catch (e) {
                    if (e.code !== 'MODULE_NOT_FOUND') {
                        console.log('Error ', e.code, ' while loading ', actionControllerPath);
                        continue;
                    }
                    console.log(`ActionController could not be found in ${actionControllerPath}`);
                    continue;
                }
                newService.actions.push(newAction);
            }

            const serviceReactionsPath = path.join(servicesPath, serviceName, 'reactions');
            let reactionDirs: Array<string> = [];
            try {
                reactionDirs = await readdir(serviceReactionsPath);
            } catch (e) {
                console.log('Unable to scan directory: ' + e);
                continue;
            }
            for (const reactionName of reactionDirs) {
                const newReaction = new Reaction;
                const reactionControllerPath = path.join(serviceReactionsPath, reactionName, reactionName + '.js');
                try {
                    const {ReactionController} = require(reactionControllerPath);
                    const controller: ReactionControllerInterface = new ReactionController();
                    newReaction.name = controller.getConfig().displayName;
                    newReaction.description = controller.getConfig().description;
                } catch (e) {
                    if (e.code !== 'MODULE_NOT_FOUND') {
                        console.log('Error ', e.code, ' while loading ', reactionControllerPath);
                        continue;
                    }
                    console.log(`ActionController could not be found in ${reactionControllerPath}`);
                    continue;
                }
                newService.reactions.push(newReaction);
            }

            services.push(newService);
        }
        return services;
    }
}

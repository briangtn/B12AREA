import {LoginObject, ServiceConfig} from "../../services-interfaces";
import config from './config.json';
import {Context} from "@loopback/context";
import {ExchangeCodeGeneratorManager} from "../../services";
import {UserRepository} from "../../repositories";

export default class ServiceController {
    static serviceName = 'airtable';

    constructor() {}

    static async start(ctx: Context): Promise<void> {
        console.debug(`Starting ${this.serviceName}`)
    }

    static async login(params: LoginObject): Promise<string> {
        const userRepository: UserRepository = await params.ctx.get('repositories.UserRepository');
        const exchangeCodeGenerator: ExchangeCodeGeneratorManager = await params.ctx.get('services.exchangeCodeGenerator');
        const codeParam = await exchangeCodeGenerator.generate({status: `Subscribed to service ${this.serviceName}`}, true);
        const user = await userRepository.findOne({
            where: {
                email: params.user.email
            }
        });

        await userRepository.addService(user?.id, {
        }, ServiceController.serviceName);
        return params.redirectUrl + '?code=' + codeParam;
    }

    static async getConfig(): Promise<ServiceConfig> {
        return config;
    }
}
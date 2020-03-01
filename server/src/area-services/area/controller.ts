import {LoginObject, ServiceConfig} from "../../services-interfaces";
import config from './config.json';
import {Context, inject} from "@loopback/context";
import {ExchangeCodeGeneratorManager} from "../../services";
import {UserRepository} from '../../repositories';
import {User} from '../../models';

export default class ServiceController {

    static async start(ctx: Context): Promise<void> {
    }

    static async login(params: LoginObject): Promise<string> {
        const userRepository: UserRepository = await params.ctx.get('repositories.UserRepository');
        const exchangeCodeGenerator: ExchangeCodeGeneratorManager = await params.ctx.get('services.exchangeCodeGenerator');

        const user : User = (await userRepository.findOne({where: {email: params.user.email}}))!;
        await userRepository.addService(user.id, {}, 'area').catch(console.log);

        const codeParam = await exchangeCodeGenerator.generate({status: `Authenticated with area`}, true);
        return params.redirectUrl + '?code=' + codeParam;
    }

    static async getConfig(): Promise<ServiceConfig> {
        return config;
    }
}
import {LoginObject, ServiceConfig} from "../../services-interfaces";
import config from './config.json';
import {Context} from "@loopback/context";
import {ExchangeCodeGeneratorManager} from "../../services";

export default class ServiceController {

    constructor() {}

    static async start(ctx: Context): Promise<void> {

    }

    static async login(params: LoginObject): Promise<string> {
        const exchangeCodeGenerator: ExchangeCodeGeneratorManager = await params.ctx.get('services.exchangeCodeGenerator');
        const codeParam = await exchangeCodeGenerator.generate({status: 'Authenticated with github'}, true);
        return params.redirectUrl + '?code=' + codeParam;
    }

    static async getConfig(): Promise<ServiceConfig> {
        return config;
    }
}
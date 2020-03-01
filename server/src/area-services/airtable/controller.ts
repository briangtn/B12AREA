import {LoginObject, PullingData, PullingJobObject, ServiceConfig} from "../../services-interfaces";
import config from './config.json';
import {Context} from "@loopback/context";
import {ExchangeCodeGeneratorManager} from "../../services";
import {UserRepository} from "../../repositories";
import {AirtableHelper} from "./Airtable.helper";
import DetectChangesHelper, {AIRTABLE_PREFIX_ENUM} from "./actions/DetectChange.helper";

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

    static async processPullingJob(data: PullingJobObject, ctx: Context): Promise<PullingData | null> {
        try {
            for (const prefix in AIRTABLE_PREFIX_ENUM) {
                if (data.name.startsWith(DetectChangesHelper.getPrefix(prefix as AIRTABLE_PREFIX_ENUM)))
                    return await AirtableHelper.processFieldUpdatePooling(data, ctx, DetectChangesHelper.diffCheckers.get(prefix as AIRTABLE_PREFIX_ENUM));
            }
        } catch (e) {
            return null;
        }
        return null;
    }

    static async getConfig(): Promise<ServiceConfig> {
        return config;
    }
}
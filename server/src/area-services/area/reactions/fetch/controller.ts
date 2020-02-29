import {applyPlaceholders, OperationStatus, ReactionConfig, WorkableObject} from '../../../../services-interfaces';
import config from './config.json';
import {Context} from "@loopback/context";
import {AreaService} from '../../../../services';
import qs from 'querystring';
import * as axios from 'axios';

interface FetchOptions {
    method: string,
    url: string,
    queryObject?: string,
    body?: string
}

const VALID_METHODS = ["GET", "POST", "DELETE", "PUT", "PATCH"];

export default class ReactionController {

    static async trigger(params: WorkableObject): Promise<void> {
        const options: FetchOptions = params.reactionOptions as FetchOptions;
        const url = applyPlaceholders(options.url, params.actionPlaceholders);

        let queryObjectString = undefined;
        if (options.queryObject)
            queryObjectString = applyPlaceholders(options.queryObject, params.actionPlaceholders);

        let bodyString = undefined;
        if (options.body)
            bodyString = applyPlaceholders(options.body, params.actionPlaceholders);

        let queryString = "";
        if (queryObjectString) {
            try {
                const queryObject = JSON.parse(queryObjectString);
                queryString = "?" + qs.stringify(queryObject);
            } catch {
                console.debug("Invalid query object");
                return;
            }
        }

        let body = {};
        if (bodyString) {
            try {
                body = JSON.parse(bodyString);
            } catch {
                console.debug("Invalid body object");
                return;
            }
        }

        const finalUrl = url + queryString;

        if (['POST', 'PUT', 'PATCH'].indexOf(options.method) >= 0) {
            axios[options.method.toLowerCase() as keyof typeof axios](finalUrl, body).then().catch((e) => console.debug);
        } else if (['GET', 'DELETE'].indexOf(options.method) >= 0) {
            axios[options.method.toLowerCase() as keyof typeof axios](finalUrl).then().catch((e) => console.debug);
        }
    }

    static async prepareData(reactionId: string, ctx: Context): Promise<object> {
        return {};
    }

    static async createReaction(userId: string, reactionConfig: FetchOptions, ctx: Context): Promise<OperationStatus> {
        const areaService: AreaService = await ctx.get('services.area');
        let validation = areaService!.validateConfigSchema(reactionConfig, config.configSchema);
        if (!validation.success) {
            return validation;
        }
        validation = this.validateOptions(reactionConfig);
        if (!validation.success) {
            return validation;
        }

        return {success: true, options: reactionConfig};
    }

    static async updateReaction(reactionId: string, oldReactionConfig: FetchOptions, newReactionConfig: FetchOptions, ctx: Context): Promise<OperationStatus> {
        const areaService: AreaService = await ctx.get('services.area');
        let validation = areaService!.validateConfigSchema(newReactionConfig, config.configSchema);
        if (!validation.success) {
            return validation;
        }
        validation = this.validateOptions(newReactionConfig);
        if (!validation.success) {
            return validation;
        }

        return {success: true, options: newReactionConfig};
    }

    static async deleteReaction(reactionId: string, reactionConfig: FetchOptions, ctx: Context): Promise<OperationStatus> {
        return {success: true};
    }

    static async getConfig(): Promise<ReactionConfig> {
        return config as ReactionConfig;
    }

    static validateOptions(reactionConfig: FetchOptions) {
        if (VALID_METHODS.indexOf(reactionConfig.method) < 0) {
            return {success: false, error: "Invalid method"};
        }
        if (reactionConfig.queryObject) {
            try {
                JSON.parse(reactionConfig.queryObject);
            } catch (e) {
                return {success: false, error: "Invalid json format for queryObject param"};
            }
        }
        if (reactionConfig.body) {
            try {
                JSON.parse(reactionConfig.body);
            } catch (e) {
                return {success: false, error: "Invalid json format for body param"};
            }
        }
        return {success: true}
    }
}
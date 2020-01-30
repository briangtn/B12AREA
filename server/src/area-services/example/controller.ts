import {LoginObject, ServiceConfig} from "../../services-interfaces";
import config from './config.json'

export default class ServiceController {
    static login(params: LoginObject): void {
        console.log('Login method of example service ', params);
    }

    static getConfig(): ServiceConfig {
        return config;
    }
}
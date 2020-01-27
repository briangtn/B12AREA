import {LoginObject, ServiceConfig, ServiceControllerInterface} from "../../services-interfaces";
import config from './config.json'

export class ServiceController implements ServiceControllerInterface {
    login(params: LoginObject): void {
        console.log('Login method of example service ', params);
    }

    getConfig(): ServiceConfig {
        return config;
    }
}
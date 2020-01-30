import {post} from "@loopback/rest";
import {ActionConfig, ActionFunction} from '../../../../services-interfaces'
import config from './config.json';

export default class ActionController {

    constructor() {}

    @post('/webhook')
    webhook() {
        ActionFunction({
            from: "example.example",
            placeholders: [{
                name: "toReplace",
                value: "Replacement value"
            }]
        })
    }

    static getConfig(): ActionConfig {
        return config;
    }
}
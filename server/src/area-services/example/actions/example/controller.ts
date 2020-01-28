import {post} from "@loopback/rest";
import {ActionConfig, ActionControllerInterface, ActionFunction} from '../../../../services-interfaces'
import config from './config.json';

export default class ActionController implements ActionControllerInterface {

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

    getConfig(): ActionConfig {
        return config;
    }
}
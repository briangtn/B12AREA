import {ReactionConfig, TriggerObject} from "../../../../services-interfaces";
import config from './config.json';

export default class ReactionController {
    static trigger(params: TriggerObject): void {
        console.log("Example reaction triggered from ", params.from, " with the following placeholders: ", params.placeholders);
    }

    static getConfig(): ReactionConfig {
        return config;
    }
}
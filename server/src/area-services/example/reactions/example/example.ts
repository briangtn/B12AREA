import {ReactionConfig, ReactionControllerInterface, TriggerObject} from "../../../../services-interfaces";
import config from './config.json';

export class ReactionController implements ReactionControllerInterface {
    trigger(params: TriggerObject): void {
        console.log("Example reaction triggered from ", params.from, " with the following placeholders: ", params.placeholders);
    }

    getConfig(): ReactionConfig {
        return config;
    }
}
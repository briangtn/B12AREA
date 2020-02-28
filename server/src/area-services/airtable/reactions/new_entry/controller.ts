import {applyPlaceholders, OperationStatus, ReactionConfig, WorkableObject} from "../../../../services-interfaces";
import config from './config.json';
import {Context} from "@loopback/context";
import {NewEntryConfig, NewEntryParsed} from "../../interfaces";
import Airtable from "airtable";
import {ReactionRepository, UserRepository} from "../../../../repositories";
import {Reaction} from "../../../../models";

export default class ReactionController {
    static async trigger(params: WorkableObject): Promise<void> {
        const preparedData : NewEntryConfig = params.reactionPreparedData as NewEntryConfig;
        const dataReplaced = applyPlaceholders(preparedData.data, params.actionPlaceholders);
        const dataParsed : NewEntryParsed = {
            ...preparedData,
            ...{entryToCreate: {}}
        };

        dataParsed.entryToCreate = JSON.parse(dataReplaced);
        console.log(dataReplaced);
        console.log("Parsed");
        console.log(dataParsed);

        const base = new Airtable({apiKey: dataParsed.apiKey}).base(dataParsed.baseID);

        base(dataParsed.tableID).create({
            "fields": dataParsed.entryToCreate
        }).then(console.log).catch(console.error);
    }

    static async prepareData(reactionId: string, ctx: Context): Promise<object> {
        let reactionRepository : ReactionRepository | undefined = undefined;
        let userRepository : UserRepository | undefined = undefined;

        try {
            reactionRepository = await ctx.get('repositories.ReactionRepository');
            userRepository = await ctx.get('repositories.UserRepository');
        } catch (e) {
            throw new Object({success: false, error: "Failed to resolve repositories", detail: e});
        }
        if (!reactionRepository || !userRepository) {
            throw new Object({success: false, error: "Failed to resolve repositories"});
        }
        const reaction: Reaction = await reactionRepository.findById(reactionId);
        const reactionConfig : NewEntryConfig = reaction.options as NewEntryConfig;

        console.log(reactionConfig);
        return reactionConfig
    }

    static async createReaction(userId: string, reactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        const reactionOptions : NewEntryConfig = reactionConfig as NewEntryConfig;

        if (reactionOptions.data === "" || reactionOptions.apiKey === "" || reactionOptions.baseID === "")
            return { success: false, error: 'Error in options'};
        return { success: true, options: reactionOptions };
    }

    static async updateReaction(reactionId: string, oldReactionConfig: Object, newReactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        const oldReactionOptions : NewEntryConfig = oldReactionConfig as NewEntryConfig;
        const newReactionOptions : NewEntryConfig = newReactionConfig as NewEntryConfig;

        if (newReactionOptions.data === "" || newReactionOptions.apiKey === "" || newReactionOptions.baseID === "")
            return { success: false, error: 'Error in new options'};
        if (oldReactionOptions.data === "" || oldReactionOptions.apiKey === "" || oldReactionOptions.baseID === "")
            return { success: false, error: 'Error in old options'};
        return { success: true, options: newReactionOptions };
    }

    static async deleteReaction(reactionId: string, reactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        return { success: true, options: reactionConfig};
    }

    static async getConfig(): Promise<ReactionConfig> {
        return config as ReactionConfig;
    }
}
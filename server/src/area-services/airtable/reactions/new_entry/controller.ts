import {applyPlaceholders, OperationStatus, ReactionConfig, WorkableObject} from "../../../../services-interfaces";
import config from './config.json';
import {Context} from "@loopback/context";
import {NewEntryConfig, NewEntryParsed} from "../../interfaces";
import {ReactionRepository, UserRepository} from "../../../../repositories";
import {Reaction} from "../../../../models";
import Airtable from "airtable";

export default class ReactionController {
    static async trigger(params: WorkableObject): Promise<void> {
        const preparedData : NewEntryConfig = params.reactionPreparedData as NewEntryConfig;
        const dataReplaced = applyPlaceholders(preparedData.data, params.actionPlaceholders);
        const dataParsed : NewEntryParsed = {
            ...preparedData,
            ...{entryToCreate: {}}
        };

        dataParsed.entryToCreate = JSON.parse(dataReplaced);

        new Airtable({apiKey: dataParsed.apiKey}).base(dataParsed.baseId)(dataParsed.tableId).create(dataParsed.entryToCreate)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .catch((err: any) =>{
                console.error(err);
            });
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

        return reactionConfig
    }

    static async createReaction(userId: string, reactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        const reactionOptions : NewEntryConfig = reactionConfig as NewEntryConfig;

        if (reactionOptions.data === "" || reactionOptions.apiKey === "" || reactionOptions.baseId === "")
            return { success: false, error: 'Error in options'};
        return { success: true, options: reactionOptions };
    }

    static async updateReaction(reactionId: string, oldReactionConfig: Object, newReactionConfig: Object, ctx: Context): Promise<OperationStatus> {
        const oldReactionOptions : NewEntryConfig = oldReactionConfig as NewEntryConfig;
        const newReactionOptions : NewEntryConfig = newReactionConfig as NewEntryConfig;

        if (newReactionOptions.data === "" || newReactionOptions.apiKey === "" || newReactionOptions.baseId === "" || newReactionOptions.tableId === "")
            return { success: false, error: 'Error in new options'};
        if (oldReactionOptions.data === "" || oldReactionOptions.apiKey === "" || oldReactionOptions.baseId === "" || oldReactionOptions.tableId === "")
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
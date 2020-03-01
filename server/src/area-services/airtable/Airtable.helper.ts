import {ActionFunction, PullingData, PullingJobObject} from "../../services-interfaces";
import {Context} from "@loopback/context";
import Airtable from 'airtable'
import {BaseConfig, Record} from "./interfaces";
import {ActionRepository} from "../../repositories";
import {isDeepStrictEqual} from "util";

function diffCheckerCreated(oldRecords: Record[], newRecords: Record[]) : Record[] {
    const diff: Record[] = [];

    for (const newRecord of newRecords) {
        const oldVersion: Record | undefined = oldRecords.find((value: Record) => {
            return value.id === newRecord.id;
        });
        if (oldVersion === undefined)
            diff.push(newRecord);
        else if (!isDeepStrictEqual(newRecord, oldVersion)) {
            diff.push(newRecord);
        }
    }
    return diff;
}

export type DiffHandler = (oldEntry: Record[], newEntry: Record[]) => Record[]

export class AirtableHelper {
    public static readonly serviceName = 'airtable';
    public static readonly AIRTABLE_PULLING_PREFIX = `${AirtableHelper.serviceName}_pulling`;

    static createFieldsPlaceholders(array: Record[], placeholderName: string): Array<{name: string, value: string}> {
        const ret: Array<{name: string, value: string}> = [];

        for (let i = 0; i < array.length; ++i) {
            const placeholder = {name: `${placeholderName}[${i}]`, value: JSON.stringify(JSON.stringify(array[i]))};

            placeholder.value = placeholder.value.substring(1, placeholder.value.length-1);
            ret.push(placeholder);
        }
        ret.push({name: `Nb${placeholderName}`, value: `${ret.length}`});
        return ret;
    }

    private static checkDiff(oldEntries: Record[], newEntries: Record[],) : Record[] {
        const diff : Record[] = [];

        const deletedUpdated = oldEntries.filter((entry) => !newEntries.includes(entry));
        const createdUpdated = newEntries.filter((entry) => !oldEntries.includes(entry));
        const deleted = deletedUpdated.filter((entry) => !createdUpdated.includes(entry));
        const created = createdUpdated.filter((entry) => !deletedUpdated.includes(entry));
        const updated = createdUpdated.filter((entry) => deletedUpdated.includes(entry));

        console.log("Deleted", deleted);
        console.log("Updated", updated);
        console.log("Created", created);
        return diff;
    }

    static async processFieldUpdatePooling(data: PullingJobObject, ctx: Context, diffChecker?: DiffHandler) : Promise<PullingData | null> {
        if (diffChecker === undefined)
            throw new Error("Unexpected type of diffchecker");
        const actionRepository: ActionRepository = await ctx.get('repositories.ActionRepository');
        const actionOptions = data.jobData as BaseConfig;
        const actionId = data.jobData.actionID;

        const action = await actionRepository.findById(actionId);
        const newRecords: Record[] = (await new Airtable({apiKey: actionOptions.apiKey}).base(actionOptions.baseId)(actionOptions.tableId).select().all()).map((record) => {
            return {
                id: record.id,
                fields: record.fields
            } as Record;
        });
        const oldRecords : Record[] = action.data as Record[];
        action.data = newRecords;
        await actionRepository.save(action);

        const diff = diffChecker(oldRecords, newRecords);

        if (diff.length !== 0) {
            console.log(diff);
            const placeholders = this.createFieldsPlaceholders(diff, "Fields");
            console.debug("Placeholders", placeholders);
            await ActionFunction({
                actionId: actionId,
                placeholders: placeholders
            }, ctx);
        }
        return null;
    }
}
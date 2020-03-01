import {ActionFunction, PullingData, PullingJobObject} from "../../services-interfaces";
import {Context} from "@loopback/context";
import Airtable from 'airtable'
import {BaseConfig, Record} from "./interfaces";
import {ActionRepository} from "../../repositories";

export type DiffHandler = (oldEntry: Record[], newEntry: Record[]) => Record[]

export class AirtableHelper {
    public static readonly serviceName = 'airtable';
    public static readonly AIRTABLE_PULLING_PREFIX = `${AirtableHelper.serviceName}_pulling`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static createPlaceholderWithObject(name: string, object: any) : {name: string, value: string} {
        const stringifiedObject = JSON.stringify(JSON.stringify(object));
        const cleanedObject = stringifiedObject.substring(1, stringifiedObject.length-1);

        return {
            name: `${name}`,
            value: cleanedObject
        };
    }

    static createFieldsPlaceholders(array: Record[], placeholderName: string): Array<{name: string, value: string}> {
        const ret: Array<{name: string, value: string}> = [];

        for (let i = 0; i < array.length; ++i) {
            ret.push(this.createPlaceholderWithObject(`${placeholderName}[${i}]`, array[i]));
        }
        ret.push({name: `Nb${placeholderName}`, value: `${ret.length}`});
        return ret;
    }

    static async processBaseUpdatePooling(data: PullingJobObject, ctx: Context, diffChecker?: DiffHandler) : Promise<PullingData | null> {
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
            const fieldsPlaceholder = {
                name: "Fields",
                value: JSON.stringify(JSON.stringify(diff))
            };
            fieldsPlaceholder.value = fieldsPlaceholder.value.substring(1, fieldsPlaceholder.value.length-1);
            const placeholders = [
                ...this.createFieldsPlaceholders(diff, "Fields"),
                AirtableHelper.createPlaceholderWithObject("Fields", diff)
            ];
            await ActionFunction({
                actionId: actionId,
                placeholders: placeholders
            }, ctx);
        }
        return null;
    }
}
import {PullingData, PullingJobObject} from "../../services-interfaces";
import {Context} from "@loopback/context";
import Airtable from 'airtable'
import {BaseConfig, Record} from "./interfaces";
import {ActionRepository} from "../../repositories";
import {deepEqual, deepStrictEqual} from "assert";
import {isDeepStrictEqual} from "util";

export class AirtableHelper {
    public static readonly AIRTABLE_PULLING_PREFRIX_FIELD_UPDATE = "airtable_field_update";
    public static readonly serviceName = 'airtable';

    static async processFieldUpdatePooling(data: PullingJobObject, ctx: Context) : Promise<PullingData | null> {
        const actionRepository: ActionRepository = await ctx.get('repositories.ActionRepository');
        const actionOptions = data.jobData as BaseConfig;
        const actionId = data.jobData.actionID;
        const diff: Record[] = [];

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

        console.log(diff);
        return null;
    }
}
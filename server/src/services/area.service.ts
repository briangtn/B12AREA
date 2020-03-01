import {bind, Context} from '@loopback/core';
import {OperationStatus} from '../services-interfaces';
import WorkerHelper from "../WorkerHelper";

export interface ConfigSchemaElement {
    name: string,
    description: string,
    type: string,
    required: boolean,
    ignorePlaceholders?: boolean
}

@bind({tags: {namespace: "services", name: "area"}})
export class AreaService {

    constructor() {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async startPulling(interval: number, name: string, service: string, ctx: Context, data?: any) {
        await WorkerHelper.AddPullingJob({
            triggerEvery: interval * 1000,
            name: name,
            service: service,
            jobData: data
        }, ctx);
    }

    async stopPulling(name: string, service: string, ctx: Context) {
        await WorkerHelper.RemovePullingJob(service, name, ctx);
    }


    validateConfigSchema(data: object, model: ConfigSchemaElement[]): OperationStatus {
        for (const modelElement of model) {
            const existInConfig = Object.keys(data).indexOf(modelElement.name) !== -1;
            const element = data[modelElement.name as keyof typeof data];
            if (modelElement.required) {
                if (modelElement.type !== 'string' && (!existInConfig || element === undefined)) {
                    return {success: false, error: `Missing ${modelElement.name} in config`};
                } else if (modelElement.type === 'string' && (!existInConfig || !element)) {
                    return {success: false, error: `Missing ${modelElement.name} in config`};
                }
            }
            if (existInConfig && typeof element !== modelElement.type) {
                return {success: false, error: `Invalid type for ${modelElement.name} (${typeof data[modelElement.name as keyof typeof data]} is not ${modelElement.type}`};
            }
        }
        return {success: true};
    }

    createWordsPlaceholders(data: string): Array<{name: string, value: string}> {
        const regex = '[^ \r\n\t]+';
        const ret: Array<{name: string, value: string}> = [];
        const re = new RegExp(regex, 'gs');
        const result = data.match(re);
        if (result === null) {
            return ret;
        }
        for (let i = 0; i < result.length; ++i) {
            ret.push({name: `Words[${i}]`, value: result[i]});
        }
        ret.push({name: `NbWords`, value: `${ret.length}`});
        return ret;
    }

    createRegexPlaceholders(data: string, regex: string, placeholderName: string): Array<{name: string, value: string}> {
        const ret: Array<{name: string, value: string}> = [];
        const re = new RegExp(regex, 'gs');
        const result = data.match(re);
        const resGroups = re.exec(data);
        if (result === null || resGroups === null) {
            return ret;
        }
        for (let i = 0; i < result.length; ++i) {
            ret.push({name: `${placeholderName}[${i}]`, value: result[i]});
        }
        ret.push({name: `Nb${placeholderName}`, value: `${ret.length}`});
        for (let i = 1; i < resGroups.length; ++i) {
            ret.push({name: `${placeholderName}Groups[${i - 1}]`, value: resGroups[i]});
        }
        ret.push({name: `Nb${placeholderName}Groups`, value: `${resGroups.length - 1}`});
        return ret;
    }
}

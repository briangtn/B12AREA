import {bind, Context} from '@loopback/core';
import axios from 'axios';
import {OperationStatus} from '../services-interfaces';

export interface ConfigSchemaElement {
    name: string,
    description: string,
    type: string,
    required: boolean
}

@bind({tags: {namespace: "services", name: "area"}})
export class AreaService {

    static pullingStarted = {};

    constructor() {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    startPulling(url: string | ((actionId?: string, ctx?: Context) => Promise<string|undefined>), params: object, diffFunction: (data: any) => Promise<any[] | null>, onDiff: (diff: any[]) => Promise<void>, interval: number, name: string, actionId?: string, ctx?: Context): NodeJS.Timeout {
        const id = setInterval(() => {
            if (typeof url === "string") {
                axios.get(url, params).then((res) => {
                    diffFunction(res.data).then(async (diff) => {
                        if (diff == null || diff.length <= 0)
                            return;
                        await onDiff(diff);
                    }).catch((err) => {});
                }).catch((err) => {
                });
            } else {
                url(actionId, ctx).then((parsedUrl: string|undefined) => {
                    if (!parsedUrl) {
                        console.error(`A pulling was enqueued with an url function but missing actionId or context. ActionId: ${actionId}`);
                        return;
                    }
                    axios.get(parsedUrl, params).then((res) => {
                        diffFunction(res.data).then(async (diff) => {
                            if (diff == null || diff.length <= 0)
                                return;
                            await onDiff(diff);
                        }).catch((err) => {});
                    }).catch((err) => {
                    });
                }).catch((err) => {
                });
            }
        }, interval * 1000);
        AreaService.pullingStarted[name as keyof typeof AreaService.pullingStarted] = id as never;
        return id;
    }

    stopPulling(name: string) {
        const to = AreaService.pullingStarted[name as keyof typeof AreaService.pullingStarted];

        clearInterval(to);
        delete AreaService.pullingStarted[name as keyof typeof AreaService.pullingStarted];
    }

    stopPullingStartWith(start: string) {
        for (const key of Object.keys(AreaService.pullingStarted)) {
            if (key.startsWith(start))
                this.stopPulling(key);
        }
    }

    validateConfigSchema(data: object, model: ConfigSchemaElement[]): OperationStatus {
        for (const modelElement of model) {
            const existInConfig = Object.keys(data).indexOf(modelElement.name) !== -1;
            const element = data[modelElement.name as keyof typeof data];
            if (modelElement.required && (!existInConfig || !element)) {
                return {success: false, error: `Missing ${modelElement.name} in config`};
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
        const re = new RegExp(regex, 'g');
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
        const re = new RegExp(regex, 'g');
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

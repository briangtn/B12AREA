import {bind} from '@loopback/core';
import sha256 from 'sha256';

@bind({tags: {namespace: "services", name: "normalizer"}})
export class NormalizerServiceService {

    // Here I use 'any' type because it's the only way to make my system compatible with all types and it's very usefull for this service
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public actions: Map<string, (value: any) => any>;

    constructor() {
        this.actions = new Map();

        this.actions.set("toUpper", (value: string): string => {
            return value.toUpperCase();
        });

        this.actions.set("toLower", (value: string): string => {
            return value.toLowerCase();
        });

        this.actions.set('hash', (value: string): string => {
            return sha256(sha256(value));
        });
    }

    normalize(toParse: object, parsingOptions: object): object | void {
        if(!toParse) return toParse;
        for (const [key, value] of Object.entries(parsingOptions)) {
            if (toParse[key as keyof typeof toParse] === undefined || toParse[key as keyof typeof toParse] === null) {
                continue;
            }
            if (typeof value === 'string') {
                const actionType: string = value as string;
                const action = this.actions.get(actionType);
                if (action === undefined) {
                    continue;
                }

                toParse[key as keyof typeof toParse] = action(toParse[key as keyof typeof toParse]) as never;
            } else if (typeof value === 'function') {
                // Here I use 'any' type because it's the only way to make my system compatible with all types and it's very usefull for this service
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const func: (type: any) => any = value;
                toParse[key as keyof typeof toParse] = func(toParse[key as keyof typeof toParse]) as never;
            } else if (typeof value === 'object' && typeof toParse[key as keyof typeof toParse] == 'object') {
                toParse[key as keyof typeof toParse] = this.normalize(toParse[key as keyof typeof toParse], value) as never;
            }
        }
        return toParse;
    }

    // Here I use 'any' type because it's the only way to make my system compatible with all types and it's very usefull for this service
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setAction(name: string, action: (value: any) => any) {
        this.actions.set(name, action);
    }
}

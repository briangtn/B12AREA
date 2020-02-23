import {bind} from '@loopback/core';
import axios from 'axios';

@bind({tags: {namespace: "services", name: "area"}})
export class AreaService {

    static pullingStarted = {};

    constructor() {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    startPulling(url: string, params: object, diffFunction: (data: any) => Promise<any[] | null>, onDiff: (diff: any[]) => Promise<void>, interval: number, name: string): NodeJS.Timeout {
        const id = setInterval(() => {
            axios.get(url, params).then((res) => {
                diffFunction(res.data).then(async (diff) => {
                    if (diff == null || diff.length <= 0)
                        return;
                    await onDiff(diff);
                }).catch((err) => {});
            }).catch((err) => {
            });
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
}

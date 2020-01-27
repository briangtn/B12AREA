import {bind} from '@loopback/core';

export interface RandomGeneratorManager {
    generateRandomString(length: number): string;
}

@bind({tags: {namespace: "services", name: "randomGenerator"}})
export class RandomGeneratorService implements RandomGeneratorManager {
    constructor() {}

    generateRandomString(length: number): string {
        let s = '';
        do {
            s += Math.random().toString(36).substr(2);
        } while (s.length < length);
        s = s.substr(0, length);
        return s;
    }
}

import {bind, inject} from '@loopback/core';
import {DataExchangeCodeRepository} from '../repositories';
import { repository, Filter, Where } from '@loopback/repository';
import {RandomGeneratorManager} from './random-generator.service';
import {DataExchangeCode} from '../models';

export interface ExchangeCodeGeneratorManager {
    generate(data: object, isPublic: boolean): Promise<string>;
    getData(code: string, onlyPublic: boolean, shouldDelete: boolean): Promise<object | null>;
}

@bind({tags: {namespace: "services", name: "exchangeCodeGenerator"}})
export class ExchangeCodeGeneratorService implements ExchangeCodeGeneratorManager {
    constructor(@repository(DataExchangeCodeRepository) public exchangeCodeRepository: DataExchangeCodeRepository,
                @inject('services.randomGenerator') protected randomGeneratorService: RandomGeneratorManager) {}

    generate(data: object, isPublic = true): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const code = this.randomGeneratorService.generateRandomString(16);
            this.exchangeCodeRepository.create({code, data}).then((result) => {
                resolve(code);
            }).catch((err) => {
                reject(err);
            })
        });
    }

    async getData(code: string, onlyPublic = true, shouldDelete = true): Promise<object | null> {
        const where: Where<DataExchangeCode> = {code};
        if (onlyPublic)
            where.public = true;
        const dataExchangeCode: DataExchangeCode | null = await this.exchangeCodeRepository.findOne({where: where});

        if (!dataExchangeCode) {
            return null;
        }
        if (shouldDelete) {
            await this.exchangeCodeRepository.deleteAll({code});
        }
        return dataExchangeCode.data;
    }
}

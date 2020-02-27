import {IService} from "./IService.interface";

export default interface IAbout {
    client: {
        host: string
    },
    server: {
        current_time: number,
        services: IService[]
    }
}

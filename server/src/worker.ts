import Queue from 'bull';
import {WorkableObject} from "./services-interfaces";
import {Application} from "@loopback/core";
import {AreaApplication} from "./application";
import {UserRepository} from "./repositories";

export class Worker {

    redisHost: string = process.env.REDIS_HOST ? process.env.REDIS_HOST : '127.0.0.1';
    redisPort: number = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379;
    redisPass?: string = process.env.REDIS_PASSWORD;
    queueName: string = process.env.BULL_QUEUE_NAME ? process.env.BULL_QUEUE_NAME : 'areaQueue';
    workerQueue: Queue.Queue;
    application: Application;

    constructor(app: AreaApplication)
    {
        this.application = app;
    }

    boot()
    {
        this.workerQueue = new Queue(this.queueName, {
            redis: {
                host: this.redisHost,
                port: this.redisPort,
                password: this.redisPass
            }
        });
    }

    async start()
    {
        this.workerQueue.process(async job => {
            await this.processJob(job.data);
        }).catch(e => {
            console.error(`Failed to process job: ${e}`);
        });
        const userRepo: UserRepository = await this.application.get('repositories.UserRepository');
        userRepo.find({}).then(console.log).catch(console.error);
    }

    async processJob(data: WorkableObject)
    {
        console.debug(`Starting to process job [${data.actionId} (${data.actionType}), ${data.reactionId} (${data.reactionType})], data: ${JSON.stringify(data)}`);
        const serviceName = data.reactionType.split('.')[0];
        const reactionName = data.reactionType.split('.')[2];
        try {
            const module = await import('./area-services/' + serviceName + '/reactions/' + reactionName + '/controller');
            const controller = module.default;
            await controller.trigger(data);
        } catch (e) {
            console.error(`Failed to process job [${data.actionId} (${data.actionType}), ${data.reactionId} (${data.reactionType})] : ${e}`);
        }
    }
}
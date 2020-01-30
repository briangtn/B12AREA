import Queue from 'bull';
import {TriggerObject} from "./services-interfaces";

export class Worker {

    redisHost: string = process.env.REDIS_HOST ? process.env.REDIS_HOST : '127.0.0.1';
    redisPort: number = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379;
    redisPass?: string = process.env.REDIS_PASSWORD;
    queueName: string = process.env.BULL_QUEUE_NAME ? process.env.BULL_QUEUE_NAME : 'areaQueue';
    workerQueue: Queue.Queue;

    constructor()
    {
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

    start()
    {
        this.workerQueue.process(async job => {
            await this.processJob(job.data);
        }).catch(e => {
            console.error(`Failed to process job: ${e}`);
        });
    }

    async processJob(data: TriggerObject)
    {
        console.log(`Starting to process job from ${data.from}, data: ${data.placeholders}`);
    }
}
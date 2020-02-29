import {DelayedJobObject, PullingData, PullingJobObject, WorkableObject} from "./services-interfaces";
import {Application} from "@loopback/core";
import {AreaApplication} from "./application";
import WorkerHelper from "./WorkerHelper";
import {BullNameToIdMapRepository} from "./repositories";
import axios from "axios";
import {BullNameToIdMap} from "./models";

export class Worker {

    application: Application;

    constructor(app: AreaApplication)
    {
        this.application = app;
    }

    public boot()
    {

    }

    public async start()
    {
        WorkerHelper.getWorkerQueue().process(async job => {
            await this.processJob(job.data);
        }).catch(e => {
            console.error(`Failed to process job:`, e);
        });
        WorkerHelper.getDelayedJobQueue().process(async job => {
            await this.processDelayedJob(job.id.toString(), job.data);
        }).catch(e => {
            console.error(`Failed to process delayed job:`, e);
        });
        WorkerHelper.getPullingJobQueue().process(async job => {
            await this.processPullingJob(job.data);
        }).catch(e => {
            console.error(`Failed to process pulling job:`, e);
        });
    }

    public async processJob(data: WorkableObject)
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

    public async processDelayedJob(jobId: string, data: DelayedJobObject) {
        console.debug(`Starting to process delayed job [delayed_${data.service}_${data.name}(${jobId})], data: ${JSON.stringify(data)}`);
        try {
            const bullNameToIdRepository: BullNameToIdMapRepository = await this.application.get('repositories.BullNameToIdMapRepository');
            const bullNameToIdMap: BullNameToIdMap|null = await bullNameToIdRepository.findOne({
                where: {
                    JobId: jobId
                }
            });
            if (!bullNameToIdMap) {
                console.debug(`Job [delayed_${data.service}_${data.name}(${jobId})] : was not found so it was ignored`);
                return;
            }
            await bullNameToIdRepository.deleteById(bullNameToIdMap.id);
            if (bullNameToIdMap.canceled) {
                console.debug(`Job [delayed_${data.service}_${data.name}(${jobId})] : was canceled in database, skipping`);
                return;
            }
            const module = await import('./area-services/' + data.service + '/controller');
            const controller = module.default;
            if (!controller.processDelayedJob) {
                console.error(`Failed to process job [delayed_${data.service}_${data.name}(${jobId})] : A delayed job was queued but service doesn't have a processDelayedJob static method`);
            } else {
                await controller.processDelayedJob(data, this.application);
            }
        } catch (e) {
            console.error(`Failed to process job [delayed_${data.service}_${data.name}(${jobId})] :`, e);
        }
    }

    public async processPullingJob(data: PullingJobObject) {
        console.debug(`Starting to process pulling job [pulling_${data.service}_${data.name}], data: ${JSON.stringify(data)}`);
        try {
            const module = await import('./area-services/' + data.service + '/controller');
            const controller = module.default;
            if (controller.processPullingJob) {
                const pullingData: PullingData|null = await controller.processPullingJob(data, this.application) as PullingData|null;
                if (pullingData)
                    await this.doTheActualPulling(pullingData);
            } else {
                console.error(`Failed to process job [pulling_${data.service}_${data.name}] : A pulling job was queued but service doesn't have a processPullingJob static method`);
            }
        } catch (e) {
            console.error(`Failed to process job [pulling_${data.service}_${data.name}] :`, e);
        }
    }

    private async doTheActualPulling(pullingData: PullingData) {
        axios.get(pullingData.url, pullingData.params).then((res) => {
            pullingData.diffFunction(res.data).then(async (diff) => {
                if (diff == null || diff.length <= 0)
                    return;
                await pullingData.onDiff(diff);
            }).catch((err) => {});
        }).catch((err) => {
        });
    }
}
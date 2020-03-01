import Queue, {Job, JobCounts} from "bull";
import {Context} from "@loopback/context";
import {
    ActionRepository,
    AreaRepository,
    BullNameToIdMapRepository,
    ReactionRepository,
    UserRepository
} from "./repositories";
import {Action, Area, BullNameToIdMap, User} from "./models";
import {DelayedJobObject, PullingJobObject, TriggerObject, WorkableObject} from "./services-interfaces";

export interface JobInfosCount {
    reactionQueue: JobCounts,
    pullingQueue: JobCounts,
    delayedQueue: JobCounts
}

export default class WorkerHelper {

    static redisHost: string = process.env.REDIS_HOST ? process.env.REDIS_HOST : '127.0.0.1';
    static redisPort: number = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379;
    static redisPass: string|undefined = process.env.REDIS_PASSWORD;

    static workerQueueName: string = process.env.BULL_QUEUE_NAME ? process.env.BULL_QUEUE_NAME : 'areaQueue';
    static workerQueue = new Queue(WorkerHelper.workerQueueName, {
        redis: {
            host: WorkerHelper.redisHost,
            port: WorkerHelper.redisPort,
            password: WorkerHelper.redisPass
        }
    });
    static delayedJobQueue = new Queue('AreaDelayedJobs', {
        redis: {
            host: WorkerHelper.redisHost,
            port: WorkerHelper.redisPort,
            password: WorkerHelper.redisPass
        }
    });
    static pullingQueue = new Queue('AreaPullingJobs', {
        redis: {
            host: WorkerHelper.redisHost,
            port: WorkerHelper.redisPort,
            password: WorkerHelper.redisPass
        }
    });

    public static getWorkerQueue(): Queue.Queue {
        return this.workerQueue;
    }

    public static getDelayedJobQueue(): Queue.Queue {
        return this.delayedJobQueue;
    }

    public static getPullingJobQueue(): Queue.Queue {
        return this.pullingQueue;
    }

    public static async ActionFunction(params: TriggerObject, ctx: Context) {
        try {
            let userRepository : UserRepository | null = null;
            let actionRepository : ActionRepository | null = null;
            let reactionRepository : ReactionRepository | null = null;
            let areaRepository : AreaRepository | null = null;
            try {
                userRepository = await ctx.get('repositories.UserRepository');
                actionRepository = await ctx.get('repositories.ActionRepository');
                reactionRepository = await ctx.get('repositories.ReactionRepository');
                areaRepository = await ctx.get('repositories.AreaRepository');
            } catch (e) {
                console.error(`[RepositoryResolve]Failed to enqueue job for action id ${params.actionId}: ${e}`);
                return;
            }
            if (!userRepository || !actionRepository || !reactionRepository || !areaRepository) {
                console.error(`[RepositoryResolveCheck]Failed to enqueue job for action id ${params.actionId}: could not resolve repositories`);
                return;
            }
            let action : Action | null = null;
            try {
                action = await actionRepository.findById(params.actionId);
            } catch (e) {
                console.error(`[ActionResolve]Failed to enqueue job for action id ${params.actionId}: ${e}`);
                return;
            }
            if (!action) {
                console.error(`[ActionResolveCheck]Failed to enqueue job for action id ${params.actionId}: could not resolve action`);
                return;
            }
            let area : Area | null = null;
            try {
                area = await areaRepository.findById(action.areaId, {
                    include: [{
                        relation: 'reactions'
                    }],
                });
            } catch (e) {
                console.error(`[AreaResolve]Failed to enqueue job for action id ${params.actionId}: ${e}`);
                return;
            }
            if (!area) {
                console.error(`[AreaResolveCheck]Failed to enqueue job for action id ${params.actionId}: could not resolve area linked to action`);
                return;
            }
            if (!area.enabled)
                return;
            if (!area.reactions || area.reactions.length === 0) {
                console.debug(`[AreaResolveCheck]Area id ${area.id!} has no reactions. Ignoring action ${params.actionId}`);
                return;
            }
            let owner : User | null = null;
            try {
                owner = await userRepository.findOne({
                    where: {
                        email: area.ownerId
                    }
                });
            } catch (e) {
                console.error(`[OwnerResolve]Failed to enqueue job for action id ${params.actionId}: ${e}`);
                return;
            }
            if (!owner) {
                console.error(`[OwnerResolveCheck]Failed to enqueue job for action id ${params.actionId}: could not resolve owner linked to area`);
                return;
            }
            for (const reaction of area.reactions) {
                const serviceName = reaction.serviceReaction.split('.')[0];
                const reactionName = reaction.serviceReaction.split('.')[2];
                try {
                    const module = await import('./area-services/' + serviceName + '/reactions/' + reactionName + '/controller');
                    const controller = module.default;
                    let reactionPreparedData = null;
                    try {
                        reactionPreparedData = await controller.prepareData(reaction.id!, ctx);
                    } catch (e) {
                        console.error(`Failed to enqueue job for action id ${params.actionId}, reaction id ${reaction.id}:`, e);
                        continue;
                    }
                    const dataPlaceholders = [
                        {name: "actionId", value: action.id!},
                        {name: "actionType", value: action.serviceAction},
                        {name: "reactionId", value: reaction.id!},
                        {name: "reactionType", value: reaction.serviceReaction},
                        {name: "areaId", value: area.id!},
                        {name: "areaName", value: area.name},
                        {name: "ownerId", value: owner.id!},
                        {name: "ownerEmail", value: owner.email},
                    ];
                    const finalPlaceholders = params.placeholders.filter((elem) => {
                        for (const dataPlaceHolder of dataPlaceholders) {
                            if (dataPlaceHolder.name === elem.name) {
                                return false;
                            }
                        }
                        return true;
                    }).concat(dataPlaceholders);
                    const preparedData: WorkableObject = {
                        actionId: action.id!,
                        actionType: action.serviceAction,
                        actionPlaceholders: finalPlaceholders,
                        areaId: area.id!,
                        areaName: area.name,
                        ownerEmail: owner.email,
                        ownerId: owner.id!,
                        reactionId: reaction.id!,
                        reactionOptions: reaction.options,
                        reactionPreparedData: reactionPreparedData,
                        reactionType: reaction.serviceReaction
                    };
                    this.workerQueue.add(`${reaction.serviceReaction}_${reaction.id}`, preparedData).catch(e => console.error(`Failed to enqueue job for action id ${params.actionId}, reaction id ${reaction.id}: ${e}`));
                } catch (e) {
                    console.error(`[ServiceResolve]Failed to enqueue job for action id ${params.actionId}: could not find reaction ${reactionName} in service ${serviceName}`);
                }
            }
        } catch (e) {
            console.error(`[ServiceResolve]An unknown error occurred while processing action id ${params.actionId}:`, e);
        }
    }

    private static async GetJobIdFromJobName(jobName: string, ctx: Context): Promise<string|null> {
        try {
            const bullNameToIdRepository: BullNameToIdMapRepository = await ctx.get('repositories.BullNameToIdMapRepository');
            const bullNameToId: BullNameToIdMap|null = await bullNameToIdRepository.findOne({
                where: {
                    and: [
                        {
                            JobName: jobName
                        },
                        {
                            canceled: {
                                neq: true
                            }
                        }
                    ]
                }
            });
            if (!bullNameToId)
                return null;
            return bullNameToId.JobId;
        } catch (e) {
            return null;
        }
    }

    private static async RemoveDelayedJobById(jobId: string, ctx: Context): Promise<DelayedJobObject|null> {
        try {
            const bullNameToIdRepository: BullNameToIdMapRepository = await ctx.get('repositories.BullNameToIdMapRepository');
            const job: Job<DelayedJobObject>|null = await this.delayedJobQueue.getJob(jobId);
            await bullNameToIdRepository.updateAll({canceled: true},{
                JobId: jobId
            });
            if (!job)
                return null;
            return job.data;
        } catch (e) {
            return null;
        }
    }

    private static async RemoveDelayedJobByName(jobName: string, ctx: Context) {
        try {
            const bullNameToIdRepository: BullNameToIdMapRepository = await ctx.get('repositories.BullNameToIdMapRepository');
            await bullNameToIdRepository.updateAll({canceled: true},{
                JobName: jobName
            });
            // eslint-disable-next-line no-empty
        } catch (e) {}
    }

    private static async RemovePullingJobById(jobId: string, ctx: Context): Promise<PullingJobObject|null> {
        try {
            const bullNameToIdRepository: BullNameToIdMapRepository = await ctx.get('repositories.BullNameToIdMapRepository');
            const bullNameToIdMap: BullNameToIdMap = (await bullNameToIdRepository.findOne({where: {JobId: jobId}}))!;
            const job: Job<PullingJobObject>|null = await this.pullingQueue.getJob(jobId);
            await this.pullingQueue.removeRepeatable(bullNameToIdMap.AddOpts as {every: number, jobId: string});
            await bullNameToIdRepository.deleteAll({
                JobId: jobId
            });
            if (!job)
                return null;
            return job.data;
        } catch (e) {
            return null;
        }
    }

    public static async AddDelayedJob(job: DelayedJobObject, ctx: Context) {
        const bullNameToIdRepository: BullNameToIdMapRepository = await ctx.get('repositories.BullNameToIdMapRepository');
        const jobName = `delayed_${job.service}_${job.name}`;
        const existingJobId: string|null = await this.GetJobIdFromJobName(jobName, ctx);
        if (existingJobId) {
            await this.RemoveDelayedJobByName(`delayed_${job.service}_${job.name}`, ctx);
        }
        let jobDelay = 0;
        if (job.triggerIn) {
            jobDelay = job.triggerIn;
        } else if (job.triggerAt) {
            jobDelay = new Date(job.triggerAt.getTime() - new Date().getTime()).getTime();
        }
        const newJob = await this.delayedJobQueue.add(job, { delay: jobDelay });
        await bullNameToIdRepository.create({
            JobId: newJob.id.toString(),
            JobName: jobName
        });
    }

    public static async RemoveDelayedJob(service: string, jobName: string, ctx: Context) {
        const existingJobId: string|null = await this.GetJobIdFromJobName(`delayed_${service}_${jobName}`, ctx);
        if (existingJobId) {
            await this.RemoveDelayedJobByName(`delayed_${service}_${jobName}`, ctx);
        }
    }

    public static async AddPullingJob(job: PullingJobObject, ctx: Context) {
        const bullNameToIdRepository: BullNameToIdMapRepository = await ctx.get('repositories.BullNameToIdMapRepository');
        const jobName = `pulling_${job.service}_${job.name}`;
        const existingJobId: string|null = await this.GetJobIdFromJobName(jobName, ctx);
        if (existingJobId) {
            await this.RemovePullingJobById(existingJobId, ctx);
        }
        const addOpts = {repeat: {every: job.triggerEvery}, jobId: jobName};
        const newJob = await this.pullingQueue.add(job, addOpts);
        await bullNameToIdRepository.create({
            JobId: newJob.id.toString(),
            JobName: jobName,
            AddOpts: {every: addOpts.repeat.every, jobId: addOpts.jobId}
        });
    }

    public static async RemovePullingJob(service: string, jobName: string, ctx: Context): Promise<PullingJobObject|null> {
        const existingJobId: string|null = await this.GetJobIdFromJobName(`pulling_${service}_${jobName}`, ctx);
        if (existingJobId) {
            return this.RemovePullingJobById(existingJobId, ctx);
        }
        return null;
    }

    public static async GetJobInfosCount(): Promise<JobInfosCount> {
        return {
            reactionQueue: await this.workerQueue.getJobCounts(),
            pullingQueue: await this.pullingQueue.getJobCounts(),
            delayedQueue: await this.delayedJobQueue.getJobCounts()
        }
    }
}
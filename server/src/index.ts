import {AreaApplication} from './application';
import {ApplicationConfig} from '@loopback/core';
import {Worker} from "./worker";

export {AreaApplication};

async function startAsAPI(app: AreaApplication)
{
  await app.start();
  await app.beforeStart();

    const url = app.restServer.url;
    console.log(`Server is running at ${url}`);
    console.log(`Try ${url}/ping`);

    return app;
}

async function startAsWorker(app: AreaApplication)
{
    const worker = new Worker(app);
    worker.boot();
    await worker.start();
    console.log(`Worker started with redis host: ${process.env.REDIS_HOST}`);
}

export async function main(options: ApplicationConfig = {})
{
    const app = new AreaApplication(options);
    await app.boot();

    let runAsWorker = false;
    for (const arg of process.argv) {
        if (arg === 'worker') {
            runAsWorker = true;
        }
    }
    if (runAsWorker) {
        return startAsWorker(app);
    } else {
        return startAsAPI(app);
    }
}

import {AreaApplication} from './application';
import {ApplicationConfig} from '@loopback/core';
import {Worker} from "./worker";

export {AreaApplication};

async function startAsAPI(options: ApplicationConfig)
{
    const app = new AreaApplication(options);
    await app.boot();
    await app.start();

    const url = app.restServer.url;
    console.log(`Server is running at ${url}`);
    console.log(`Try ${url}/ping`);

    return app;
}

async function startAsWorker()
{
    const app = new Worker();
    app.boot();
    app.start();
    console.log(`Worker started with redis host: ${process.env.REDIS_HOST}`);
}

export async function main(options: ApplicationConfig = {})
{
    let runAsWorker = false;
    for (const arg of process.argv) {
        if (arg === 'worker') {
            runAsWorker = true;
        }
    }
    if (runAsWorker) {
        return startAsWorker();
    } else {
        return startAsAPI(options);
    }
}

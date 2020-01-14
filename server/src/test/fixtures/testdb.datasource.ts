import {juggler} from '@loopback/repository';

import {GenericContainer, StartedTestContainer} from 'testcontainers';

let mongo: StartedTestContainer;

async function startMongo() {
    const container = await new GenericContainer('mongo')
        .withName('mongo_area_test')
        .withExposedPorts(27017)
        .start();
    process.env.DB_HOST = container.getContainerIpAddress();
    process.env.DB_PORT = container.getMappedPort(27017).toString();

    return container;
}

export const testdb: juggler.DataSource = new juggler.DataSource({
    name: 'db',
    connector: 'memory'
});

before(async function() {
    if (process.env.CI) return;
    process.env.KUBERNETES_SERVICE_HOST = 'localhost';
    // eslint-disable-next-line no-invalid-this
    this.timeout(30 * 1000);
    mongo = await startMongo();
});

after(async function() {
    if (process.env.CI) return;
    // eslint-disable-next-line no-invalid-this
    this.timeout(30 * 1000);
    if (mongo) await mongo.stop();
});
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
    // eslint-disable-next-line no-invalid-this
    this.timeout(1000 * 60 * 10);
    if (process.env.CI) {
        process.env.DB_HOST = "localhost";
        process.env.DB_PORT = "27017";
        process.env.DB_USER = "";
        process.env.DB_PASS = "";
    } else {
        process.env.KUBERNETES_SERVICE_HOST = 'localhost';
        mongo = await startMongo();
    }
    // eslint-disable-next-line no-invalid-this
    this.timeout(1000 * 60 * 10); // 10 minutes timeout
});

after(async function() {
    if (mongo) await mongo.stop();
});
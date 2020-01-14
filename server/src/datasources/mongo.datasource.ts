import {
    inject,
    lifeCycleObserver,
    LifeCycleObserver,
    ValueOrPromise,
} from '@loopback/core';
import {juggler, AnyObject} from '@loopback/repository';
import config from './mongo.datasource.config.json';

function updateConfig(dsConfig: AnyObject) {
    dsConfig.host = process.env.DB_HOST ? process.env.DB_HOST : "localhost";
    dsConfig.port = parseInt((process.env.DB_PORT ? process.env.DB_PORT : '27017') as string);
    dsConfig.user = process.env.DB_USER ? process.env.DB_USER : dsConfig.user;
    dsConfig.password = process.env.DB_PASS ? process.env.DB_PASS : dsConfig.password;
    dsConfig.database = process.env.DB_NAME ? process.env.DB_NAME : dsConfig.database;

    return dsConfig;
}

@lifeCycleObserver('datasource')
export class MongoDataSource extends juggler.DataSource
    implements LifeCycleObserver {
    static dataSourceName = 'mongo';



    constructor(
        @inject('datasources.config.mongo', {optional: true}) dsConfig: object = config,
    ) {
        dsConfig = updateConfig(dsConfig);
        super(dsConfig);
    }

    /**
     * Start the datasource when application is started
     */
    start(): ValueOrPromise<void> {
        // Add your logic here to be invoked when the application is started
    }

    /**
     * Disconnect the datasource when application is stopped. This allows the
     * application to be shut down gracefully.
     */
    stop(): ValueOrPromise<void> {
        return super.disconnect();
    }
}

import {DefaultCrudRepository} from '@loopback/repository';
import {GithubWebhook, GithubWebhookRelations} from '../models';
import {MongoDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class GithubWebhookRepository extends DefaultCrudRepository<
    GithubWebhook,
    typeof GithubWebhook.prototype.id,
    GithubWebhookRelations
    > {
    constructor(
        @inject('datasources.mongo') dataSource: MongoDataSource,
    ) {
        super(GithubWebhook, dataSource);
    }
}

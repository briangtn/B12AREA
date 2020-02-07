import {RestBindings, get, post, param, api} from '@loopback/rest';

// Uncomment these imports to begin using these cool features!

// import {inject} from '@loopback/context';

@api({basePath: '/services', paths: {}})
export class ServicesController {
    constructor() {
    }

    @get('/')
    getServices() {

    }

    @post('/subscribe/{service_name}')
    subscribe(
        @param.path.string('service_name') serviceName: string
    ) {
    }

    @post('/unsubscribe/{service_name}')
    unsubscribe(
        @param.path.string('service_name') serviceName: string
    ) {
    }

    @get('/schema/{service_name}')
    getSchemaForService(
        @param.path.string('service_name') serviceName: string
    ) {

    }

    @get('/{id}')
    getService(
        @param.path.string('id') id: string
    ) {
    }
}

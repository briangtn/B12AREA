import {RestBindings, get, post, patch, del, param, api} from '@loopback/rest';

// Uncomment these imports to begin using these cool features!

// import {inject} from '@loopback/context';

@api({basePath: '/reactions', paths: {}})
export class ReactionsControllerController {
    constructor() {}

    @get('/{area_id}')
    getReactionForArea(
        @param.path.string('area_id') areaId: string
    ) {

    }

    @post('/{area_id}')
    createReactionForArea(
        @param.path.string('area_id') areaId: string
    ) {
    }

    @patch('/{id}')
    update(
        @param.path.string('id') id: string
    ) {

    }

    @del('/{id}')
    delete(
        @param.path.string('id') id: string
    ) {

    }
}
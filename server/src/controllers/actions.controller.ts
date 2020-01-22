import {RestBindings, get, post, patch, del, param, api} from '@loopback/rest';

// Uncomment these imports to begin using these cool features!

// import {inject} from '@loopback/context';

@api({basePath: '/actions', paths: {}})
export class ActionsControllerController {
    constructor() {
    }

    @get('/{area_id}')
    getActionsForArea(
        @param.path.string('area_id') areaId: string
    ) {

    }

    @post('/{area_id}')
    createActionForArea(
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

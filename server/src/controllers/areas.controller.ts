import {RestBindings, get, post, patch, del, param, api} from '@loopback/rest';

// Uncomment these imports to begin using these cool features!

// import {inject} from '@loopback/context';

@api({basePath: '/areas', paths: {}})
export class AreasControllerController {
    constructor() {
    }

    @get('/')
    getAreas() {

    }

    @get('/{id}')
    getArea(
        @param.path.string('id') id: string
    ) {

    }

    @post('/')
    create() {

    }

    @patch('/{id}')
    update() {

    }

    @del('/{id}')
    delete() {

    }

    @patch('/enable/{id}')
    enable(
        @param.path.string('id') id: string
    ) {
    }

    @patch('/disable/{id}')
    disable(
        @param.path.string('id') id: string
    ) {
    }

    @get('/actions/{area_id}')
    getActions(
        @param.path.string('area_id') areaId: string
    ) {

    }

    @get('/reactions/{area_id}')
    getReactions(
        @param.path.string('area_id') areadId: string
    ) {

    }

}


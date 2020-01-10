import {RestBindings, Response, get} from '@loopback/rest';
import {inject} from '@loopback/context';


export class ApiStatusControllerController {
    constructor(@inject(RestBindings.Http.RESPONSE) protected response: Response) {}

    @get('/readinessProbe', {
        responses: {
            '200': {
                description: 'Return a http code 200 if the api is up'
            }
        }
    })
    isReady(): boolean {
        return true;
    }
}

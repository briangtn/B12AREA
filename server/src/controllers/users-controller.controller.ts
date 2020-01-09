import {RestBindings, get, post, patch, param, api} from '@loopback/rest';
import {inject} from '@loopback/context';
// Uncomment these imports to begin using these cool features!

@api({basePath: '/users', paths: {}})
export class UsersControllerController {
    constructor() {}

    @get('/')
    getUsers() {

    }

    @post('/register')
    register() {

    }

    @post('/login')
    login() {

    }

    @get('/{id}')
    getUser(
        @param.path.string('id') id: string
    ): string {
        return "Salut " + id;
    }

    @patch('/{id}')
    updateUser(
        @param.path.string('id') id: string
    ) {

    }

    @post('/resetPassword')
    sendResetPasswordMail() {
    }

    @patch('/resetPassword')
    resetPassword(
        @param.query.string('token') token?: string
    ) {
    }

    @patch('/validate')
    validateAccount(
        @param.query.string('token') token?: string
    ) {
    }



}

import {RestBindings, getModelSchemaRef, requestBody, get, post, patch, param, api, HttpErrors} from '@loopback/rest';
import {property, repository, model} from '@loopback/repository';
import {inject} from '@loopback/context';
import {User} from '../models';
import validator from 'validator';
import {NormalizerServiceService} from '../services';
import {UserRepository} from '../repositories/user.repository';
// Uncomment these imports to begin using these cool features!

@model()
export class NewUserRequest  {
    @property({
        type: 'string',
        required: true
    })
    email: string;

    @property({
        type: 'string',
        required: true
    })
    password: string;
}

@api({basePath: '/users', paths: {}})
export class UserController {
    constructor(@repository(UserRepository) public userRepository: UserRepository,
        @inject('services.normalizer')
        protected normalizerService: NormalizerServiceService) {}

    @get('/')
    getUsers() {

    }

    @post('/register', {
        responses: {
            '200': {
                description: 'Register an user',
                content: {
                    'application/json': {
                        schema: {
                            'x-ts-type': User
                        }
                    }
                }
            }
        }
    })
    async register(@requestBody() userRequest: NewUserRequest) {
        const normalizedUser: NewUserRequest = this.normalizerService.normalize(userRequest, {email: 'toLower', password: 'hash'}) as NewUserRequest;

        if (!normalizedUser || !validator.isEmail(normalizedUser.email)) {
            throw new HttpErrors.UnprocessableEntity('Invalid email.');
        }

        const users = await this.userRepository.find({where: {"email": normalizedUser.email}});
        if (users.length > 0) {
            throw new HttpErrors.Conflict('Email already in use');
        }
        return this.userRepository.create(normalizedUser);
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

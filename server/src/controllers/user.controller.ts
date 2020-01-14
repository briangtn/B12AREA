import {RestBindings, getModelSchemaRef, requestBody, get, post, patch, param, api, HttpErrors} from '@loopback/rest';
import {property, repository} from '@loopback/repository';
import {inject} from '@loopback/context';
import {User} from '../models';
import validator from 'validator';
import {NormalizerServiceService} from '../services';
import {UserRepository} from '../repositories/user.repository';
// Uncomment these imports to begin using these cool features!

export class NewUserRequest extends User {
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
    async register(@requestBody({
        content: {
            'application/json': {
                schema: getModelSchemaRef(NewUserRequest, {
                    title: 'Register user'
                })
            }
        }
    }) userRequest: NewUserRequest) {
        const normalizedUser: NewUserRequest = this.normalizerService.normalize(userRequest, {email: 'toLower', password: 'hash'}) as NewUserRequest;

        if (!validator.isEmail(userRequest.email)) {
            throw new HttpErrors.UnprocessableEntity('invalid email');
        }

        try {
            return await this.userRepository.create(normalizedUser);
        } catch (e) {
            if (e.code === 11000 && e.errmsg.includes('index: uniqueEmail')) {
                throw new HttpErrors.Conflict('Email is already in use');
            } else {
                throw e;
            }
        }
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

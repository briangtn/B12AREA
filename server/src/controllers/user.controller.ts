import {RestBindings, requestBody, get, post, patch, param, api, HttpErrors} from '@loopback/rest';
import {property, repository, model} from '@loopback/repository';
import {inject} from '@loopback/context';
import {User} from '../models';
import validator from 'validator';
import {NormalizerServiceService, UserService} from '../services';
import {Credentials, UserRepository} from '../repositories/user.repository';
import {TokenService} from "@loopback/authentication";
import {UserProfile} from "@loopback/security";
import {TokenServiceBindings} from "../keys";
import {CredentialsRequestBody, RegisterRequestBody} from "./specs/user-controller.specs";

@api({basePath: '/users', paths: {}})
export class UserController {
    constructor(@repository(UserRepository) public userRepository: UserRepository,
        @inject('services.normalizer')
        protected normalizerService: NormalizerServiceService,

        @inject('services.user')
        protected userService: UserService,

        @inject(TokenServiceBindings.TOKEN_SERVICE)
        protected tokenService: TokenService,
    ) {}

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
    async register(@requestBody(RegisterRequestBody) credentials: Credentials) {
        const normalizedUser: Credentials = this.normalizerService.normalize(credentials, {email: 'toLower', password: 'hash'}) as Credentials;

        if (!normalizedUser)
            throw new HttpErrors.InternalServerError();

        if (!validator.isEmail(normalizedUser.email)) {
            throw new HttpErrors.UnprocessableEntity('Invalid email.');
        }

        const users = await this.userRepository.find({where: {"email": normalizedUser.email}});
        if (users.length > 0) {
            throw new HttpErrors.Conflict('Email already in use');
        }
        return this.userRepository.create(normalizedUser);
    }

    @post('/login', {
        responses: {
            '200': {
                description: 'Gives a JWT to a user that logged in',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                token: {
                                    type: 'string',
                                },
                            },
                        },
                    },
                },
            },
        },
    })
    async login(
        @requestBody(CredentialsRequestBody) credentials: Credentials,
    ): Promise<{token: string}> {
        const normalizeCredentials: Credentials = this.normalizerService.normalize(credentials, {email: 'toLower', password: 'hash'}) as Credentials;

        if (!normalizeCredentials)
            throw new HttpErrors.UnprocessableEntity();
        else if (!validator.isEmail(normalizeCredentials.email))
            throw new HttpErrors.UnprocessableEntity('Invalid email');

        const user = await this.userService.checkCredentials(credentials);
        const token = await this.tokenService.generateToken({
            email: user.email
        } as UserProfile);

        return {token};
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

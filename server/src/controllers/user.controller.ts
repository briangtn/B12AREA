import {RestBindings, requestBody, get, post, patch, param, api, HttpErrors, getModelSchemaRef} from '@loopback/rest';
import {property, repository, model} from '@loopback/repository';
import {inject} from '@loopback/context';
import {User} from '../models';
import validator from 'validator';
import {EmailManager, NormalizerServiceService, RandomGeneratorManager} from '../services';
import {UserRepository} from '../repositories/user.repository';
import * as url from 'url';
import {UrlWithStringQuery} from "url";
// Uncomment these imports to begin using these cool features!

@model()
export class NewUserRequest  {
    @property({
        type: 'string',
        required: true,
        regexp: '^w+([.-]?w+)*@w+([.-]?w+)*(.w{2,3})+$',
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
        protected normalizerService: NormalizerServiceService,
        @inject('services.randomGenerator')
        protected randomGeneratorService: RandomGeneratorManager,
        @inject('services.email')
        protected emailService: EmailManager) {}

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
            },
            '400': {
                description: 'Missing redirect URL or invalid email',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                error: {
                                    type: 'object',
                                    properties: {
                                        statusCode: {
                                            type: 'number',
                                            example: 400
                                        },
                                        name: {
                                            type: 'string',
                                            example: 'BadRequestError'
                                        },
                                        message: {
                                            type: 'string'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '409': {
                description: 'Email already in use',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                error: {
                                    type: 'object',
                                    properties: {
                                        statusCode: {
                                            type: 'number',
                                            example: 409
                                        },
                                        name: {
                                            type: 'string',
                                            example: 'ConflictError'
                                        },
                                        message: {
                                            type: 'string',
                                            example: 'Email already in use'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    })
    async register(@requestBody() userRequest: NewUserRequest, @param.query.string('redirectURL') redirectURL?: string) {
        const normalizedUser: User = this.normalizerService.normalize(userRequest, {email: 'toLower', password: 'hash'}) as User;

        if (!redirectURL) {
            throw new HttpErrors.BadRequest('Missing redirect URL.');
        }
        if (!normalizedUser)
            throw new HttpErrors.InternalServerError();

        if (!validator.isEmail(normalizedUser.email)) {
            throw new HttpErrors.BadRequest('Invalid email.');
        }

        const users = await this.userRepository.find({where: {"email": normalizedUser.email}});
        if (users.length > 0) {
            throw new HttpErrors.Conflict('Email already in use');
        }

        normalizedUser.role = ["email_not_validated"];
        const validationToken: string = this.randomGeneratorService.generateRandomString(24);
        normalizedUser.validationToken = validationToken;
        const user: User = await this.userRepository.create(normalizedUser);

        const parsedURL: url.UrlWithStringQuery = url.parse(redirectURL);
        let endURL: string = parsedURL.protocol + '//' + parsedURL.host + parsedURL.pathname;
        if (parsedURL.search) {
            endURL += parsedURL.search + "&token=" + validationToken;
        } else {
            endURL += "?token=" + validationToken;
        }
        const templateParams: Object = {
            redirectURL: endURL
        };
        const htmlData: string = await this.emailService.getHtmlFromTemplate("emailValidation", templateParams);
        const textData: string = await this.emailService.getTextFromTemplate("emailValidation", templateParams);
        this.emailService.sendMail({
            from: "AREA <noreply@b12powered.com>",
            to: normalizedUser.email,
            subject: "Welcome to AREA",
            html: htmlData,
            text: textData
        }).catch(e => console.log("Failed to deliver email validation email: ", e));

        return user;
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
    async updateUser(
        @param.path.string('id') id: string,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(User, {partial: true}),
                },
            },
        }) user: User,
    ) {
        await this.userRepository.updateById(id, user);
    }

    @post('/resetPassword')
    sendResetPasswordMail() {
    }

    @patch('/resetPassword')
    resetPassword(
        @param.query.string('token') token?: string
    ) {
    }

    @patch('/validate', {
        responses: {
            '200': {
                description: 'Email validated',
                content: {
                    'application/json': {
                        schema: {
                            'x-ts-type': User
                        }
                    }
                }
            },
            '400': {
                description: 'Missing token',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                error: {
                                    type: 'object',
                                    properties: {
                                        statusCode: {
                                            type: 'number',
                                            example: 400
                                        },
                                        name: {
                                            type: 'string',
                                            example: 'BadRequestError'
                                        },
                                        message: {
                                            type: 'string',
                                            example: 'Missing token'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '404': {
                description: 'Token not found',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                error: {
                                    type: 'object',
                                    properties: {
                                        statusCode: {
                                            type: 'number',
                                            example: 404
                                        },
                                        name: {
                                            type: 'string',
                                            example: 'NotFoundError'
                                        },
                                        message: {
                                            type: 'string',
                                            example: 'Token not found'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    })
    async validateAccount(
        @param.query.string('token') token?: string
    ) {
        if (!token) {
            throw new HttpErrors.BadRequest('Missing token');
        }

        const user: User|null = await this.userRepository.findOne({
            where: {
                validationToken: token
            }
        });

        if (!user) {
            throw new HttpErrors.NotFound('Token not found');
        }

        return this.userRepository.validateEmail(user.id!);
    }



}

import {RestBindings, requestBody, get, post, patch, param, api, HttpErrors} from '@loopback/rest';
import {property, repository, model} from '@loopback/repository';
import {inject} from '@loopback/context';
import {User} from '../models';
import validator from 'validator';
import {Credentials, UserRepository} from '../repositories/user.repository';
import {authenticate, TokenService} from "@loopback/authentication";
import {SecurityBindings, UserProfile} from "@loopback/security";
import {TokenServiceBindings} from "../keys";
import {CredentialsRequestBody} from "./specs/user-controller.specs";
import {OPERATION_SECURITY_SPEC} from "../utils/security-specs";
import {
    CustomUserProfile,
    EmailManager,
    NormalizerServiceService,
    RandomGeneratorManager,
    TwoFactorAuthenticationManager,
    UserService
} from '../services';
import * as url from 'url';
import {UrlWithStringQuery} from "url";

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

@model()
export class AskForPasswordResetRequest {
    @property({
        type: 'string',
        required: true,
        regexp: '^w+([.-]?w+)*@w+([.-]?w+)*(.w{2,3})+$'
    })
    email: string;

    @property({
        type: 'string',
        required: true
    })
    redirectURL: string;
}

@model()
export class ValidatePasswordResetRequest {
    @property({
        type: 'string',
        required: true
    })
    token: string;
    @property({
        type: 'string',
        required: true
    })
    password: string;
}

@model()
export class Validate2FARequest {
    @property({
        type: 'string',
        required: true
    })
    token: string;
}

@api({basePath: '/users', paths: {}})
export class UserController {
    constructor(@repository(UserRepository) public userRepository: UserRepository,
        @inject('services.normalizer')
        protected normalizerService: NormalizerServiceService,

        @inject('services.user')
        protected userService: UserService,

        @inject(TokenServiceBindings.TOKEN_SERVICE)
        protected tokenService: TokenService,

        @inject('services.email')
        protected emailService: EmailManager,

        @inject('services.randomGenerator')
        protected randomGeneratorService: RandomGeneratorManager,

        @inject('services.2fa')
        protected twoFactorAuthenticationService: TwoFactorAuthenticationManager,
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
        normalizedUser.twoFactorAuthenticationEnabled = false;
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
        '422': {
            description: 'Invalid params',
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
                                        example: 422
                                    },
                                    name: {
                                        type: 'string',
                                        example: 'UnprocessableEntityError'
                                    },
                                    message: {
                                        type: 'string',
                                        example: 'The request body is invalid. See error object `details` property for more info.'
                                    },
                                    details: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                message: {
                                                    type: 'string',
                                                    example: 'should have required property \'email\' and \'password\''
                                                }
                                            }
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
    async login(
        @requestBody(CredentialsRequestBody) credentials: Credentials,
    ): Promise<{token: string}> {
        if (credentials.password.length === 0)
            throw new HttpErrors.UnprocessableEntity('Empty password');
        const normalizeCredentials: Credentials = this.normalizerService.normalize(credentials, {email: 'toLower', password: 'hash'}) as Credentials;

        if (!normalizeCredentials)
            throw new HttpErrors.UnprocessableEntity();
        else if (!validator.isEmail(normalizeCredentials.email))
            throw new HttpErrors.UnprocessableEntity('Invalid email');

        const user: User = await this.userService.checkCredentials(credentials);
        const token = await this.tokenService.generateToken({
            email: user.email,
            require2fa: user.twoFactorAuthenticationEnabled,
            validated2fa: false
        } as CustomUserProfile);

        return {token};
    }

    @get('/me', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': {
                description: 'Own profile',
                content: {
                    'application/json': {
                        schema: User,
                    },
                },
            },
        },
    })
    @authenticate('jwt-all')
    async getMe(
        @inject(SecurityBindings.USER) currentUserProfile: UserProfile
    ) {
        const user: User|null = await this.userRepository.findOne({
            where: {
                email: currentUserProfile.email
            }
        });
        return user;
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

    @post('/resetPassword', {
        responses: {
            '200': {
                description: 'Email sent if user exist'
            },
            '400': {
                description: 'Invalid email',
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
                                            example: 'Invalid email.'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '422': {
                description: 'Invalid params',
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
                                            example: 422
                                        },
                                        name: {
                                            type: 'string',
                                            example: 'UnprocessableEntityError'
                                        },
                                        message: {
                                            type: 'string',
                                            example: 'The request body is invalid. See error object `details` property for more info.'
                                        },
                                        details: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    message: {
                                                        type: 'string',
                                                        example: 'should have required property \'email\''
                                                    }
                                                }
                                            }
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
    async sendResetPasswordMail(@requestBody() userRequest: AskForPasswordResetRequest) {
        const normalizedRequest: AskForPasswordResetRequest = this.normalizerService.normalize(userRequest, {email: 'toLower'}) as AskForPasswordResetRequest;

        if (!normalizedRequest) {
            throw new HttpErrors.InternalServerError();
        }

        if (!validator.isEmail(normalizedRequest.email)) {
            throw new HttpErrors.BadRequest('Invalid email.');
        }

        const user: User|null = await this.userRepository.findOne({where: {"email": normalizedRequest.email}});

        const resetToken: string = this.randomGeneratorService.generateRandomString(24);

        const parsedURL: url.UrlWithStringQuery = url.parse(userRequest.redirectURL);
        let endURL: string = parsedURL.protocol + '//' + parsedURL.host + parsedURL.pathname;
        if (parsedURL.search) {
            endURL += parsedURL.search + "&token=" + resetToken;
        } else {
            endURL += "?token=" + resetToken;
        }
        const templateParams: Object = {
            redirectURL: endURL,
            redirectProtocol: parsedURL.protocol,
            redirectHost: parsedURL.host
        };
        const htmlData: string = await this.emailService.getHtmlFromTemplate("passwordAskReset", templateParams);
        const textData: string = await this.emailService.getTextFromTemplate("passwordAskReset", templateParams);

        if (user) {
            await this.userRepository.updateById(user.id, {
                resetToken: resetToken
            });
            this.emailService.sendMail({
                from: "AREA <noreply@b12powered.com>",
                to: user.email,
                subject: "Reset password instructions",
                html: htmlData,
                text: textData
            }).catch(e => console.log("Failed to deliver password reset email: ", e));
        }

        return {};
    }

    @patch('/resetPassword', {
        responses: {
            '200': {
                description: 'Password changed',
                content: {
                    'application/json': {
                        schema: {
                            'x-ts-type': User
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
            },
            '422': {
                description: 'Invalid params',
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
                                            example: 422
                                        },
                                        name: {
                                            type: 'string',
                                            example: 'UnprocessableEntityError'
                                        },
                                        message: {
                                            type: 'string',
                                            example: 'The request body is invalid. See error object `details` property for more info.'
                                        },
                                        details: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    message: {
                                                        type: 'string',
                                                        example: 'should have required property \'password\''
                                                    }
                                                }
                                            }
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
    async resetPassword(@requestBody() userRequest: ValidatePasswordResetRequest) {
        const normalizedRequest: ValidatePasswordResetRequest = this.normalizerService.normalize(userRequest, {password: 'hash'}) as ValidatePasswordResetRequest;

        if (!normalizedRequest) {
            throw new HttpErrors.InternalServerError();
        }

        const user: User|null = await this.userRepository.findOne({
            where: {
                resetToken: normalizedRequest.token
            }
        });

        if (!user) {
            throw new HttpErrors.NotFound('Token not found');
        }

        return this.userRepository.updatePassword(user.id!, normalizedRequest.password);
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

    @post('/2fa/activate', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': {
                description: 'Returned otp auth url',
                content: {
                    'application/json': {
                        schema: 'string',
                    },
                },
            },
        },
    })
    @authenticate('jwt-all')
    async activate2FAGenerateCode(@inject(SecurityBindings.USER) currentUserProfile: CustomUserProfile) {
        const user: User|null = await this.userRepository.getFromUserProfile(currentUserProfile);
        if (!user) {
            throw new HttpErrors.InternalServerError('Failed to retrieve user from database');
        }
        if (user.twoFactorAuthenticationEnabled) {
            throw new HttpErrors.BadRequest('2FA already activated');
        }
        const {otpauthUrl, base32} = this.twoFactorAuthenticationService.generate2FACode();
        await this.userRepository.updateById(user.id, {
            twoFactorAuthenticationSecret: base32,
            twoFactorAuthenticationEnabled: false
        });
        return {otpauthUrl}
    }

    @patch('/2fa/activate', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': {
                description: '2FA activated for user',
                content: {
                    'application/json': {
                        schema: User,
                    },
                },
            },
        },
    })
    @authenticate('jwt-all')
    async activate2FAValidateCode(
        @requestBody() userRequest: Validate2FARequest,
        @inject(SecurityBindings.USER) currentUserProfile: CustomUserProfile
    ) {
        const user: User|null = await this.userRepository.getFromUserProfile(currentUserProfile);
        if (!user) {
            throw new HttpErrors.InternalServerError('Failed to retrieve user from database');
        }
        if (user.twoFactorAuthenticationEnabled) {
            throw new HttpErrors.BadRequest('2FA already activated');
        }
        const verified: boolean = this.twoFactorAuthenticationService.verify2FACode(userRequest.token, user);
        if (!verified) {
            throw new HttpErrors.BadRequest('Invalid token please retry');
        }
        await this.userRepository.updateById(user.id, {
            twoFactorAuthenticationEnabled: true
        });
        return this.userRepository.findById(user.id);
    }

    @post('/2fa/validate', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': {
                description: 'JWT token returned',
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
    @authenticate('jwt-2fa')
    async validate2FA(
        @requestBody() userRequest: Validate2FARequest,
        @inject(SecurityBindings.USER) currentUserProfile: CustomUserProfile
    ) {
        const user: User|null = await this.userRepository.getFromUserProfile(currentUserProfile);
        if (!user) {
            throw new HttpErrors.InternalServerError('Failed to retrieve user from database');
        }
        if (!user.twoFactorAuthenticationEnabled) {
            throw new HttpErrors.BadRequest('2FA is not activated for this account');
        }
        const verified: boolean = this.twoFactorAuthenticationService.verify2FACode(userRequest.token, user);
        if (!verified) {
            throw new HttpErrors.BadRequest('Invalid token please retry');
        }
        const token = await this.tokenService.generateToken({
            email: user.email,
            require2fa: user.twoFactorAuthenticationEnabled,
            validated2fa: true
        } as CustomUserProfile);
        return {token};
    }

}

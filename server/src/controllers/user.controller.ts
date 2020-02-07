import {requestBody, get, post, patch, param, api, HttpErrors, del} from '@loopback/rest';
import {property, repository, model} from '@loopback/repository';
import {inject, Context} from '@loopback/context';
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
import {response200, response400, response401, response404, response409, response422} from './specs/doc.specs';
import { authorize } from '@loopback/authorization';

@model()
export class NewUserRequest {
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

@model()
export class UpdateUserRequest {
    @property({
        type: 'string',
        required: false,
        regexp: '^w+([.-]?w+)*@w+([.-]?w+)*(.w{2,3})+$',
    })
    email?: string;

    @property({
        type: 'string',
        required: false
    })
    password?: string;

    @property({
        type: 'boolean',
        required: false
    })
    disable2FA?: boolean;

    @property({
        type: 'array',
        itemType: 'string',
        required: false
    })
    role?: string[];
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

        @inject.context() private ctx: Context
    ) {}
    @get('/')
    getUsers() {
    }

    @post('/register', {
        responses: {
            '200': response200(User, "Register an user"),
            '400': response400('Missing redirect URL or invalid email'),
            '409': response409('Email already in use')
        }
    })
    async register(@requestBody(CredentialsRequestBody) userRequest: NewUserRequest, @param.query.string('redirectURL') redirectURL?: string) {
        const normalizedUser: User = this.normalizerService.normalize(userRequest, {
            email: 'toLower',
            password: 'hash'
        }) as User;

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
        normalizedUser.validationToken = await this.userRepository.changeMail(normalizedUser.email, redirectURL);
        normalizedUser.twoFactorAuthenticationEnabled = false;
        const user: User = await this.userRepository.create(normalizedUser);

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
                                require2fa: {
                                    type: 'boolean'
                                }
                            },
                        },
                    },
                },
            },
        },
        '422': response422('Invalid params', 'should have required property \'email\' and \'password\'')
    })
    async login(
        @requestBody(CredentialsRequestBody) credentials: Credentials,
    ): Promise<{ token: string, require2fa: boolean }> {
        if (credentials.password.length === 0)
            throw new HttpErrors.UnprocessableEntity('Empty password');
        const normalizeCredentials: Credentials = this.normalizerService.normalize(credentials, {
            email: 'toLower',
            password: 'hash'
        }) as Credentials;

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

        return {token, require2fa: user.twoFactorAuthenticationEnabled};
    }

    @get('/serviceLogin/{serviceName}', {
        responses: {
            '200': {
                description: 'The url where you have to redirect'
            },
            '400': response400('Missing redirect url'),
            '404': response404('Service not found')
        }
    })
    async serviceLogin(
        @param.path.string('serviceName') serviceName: string,
        @param.query.string('redirectURL') redirectURL: string
    ): Promise<string> {
        try {
            const module = await import('../area-auth-services/' + serviceName + '/controller');
            const controller = module.default;
            return controller.login(redirectURL, this.ctx);
        } catch (e) {
            throw new HttpErrors.NotFound('Service not found');
        }
    }

    @get('/me', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': response200(User, 'Own profile')
        },
    })
    @authenticate('jwt-all')
    async getMe(
        @inject(SecurityBindings.USER) currentUserProfile: UserProfile
    ) {
        const user: User | null = await this.userRepository.findOne({
            where: {
                email: currentUserProfile.email
            }
        });
        return user;
    }

    @patch('/me', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': response200(User, 'Return user'),
            '400': response400('Bad request'),
            '404': response404('User not found'),
            '401': {
                description: 'Unauthorized'
            }
        }
    })
    @authenticate('jwt-all')
    async updateMe(
        @requestBody() newUser: UpdateUserRequest,
        @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
        @param.query.string('redirectURL') redirectURL?: string
    ) {
        const updatedUser: User = this.normalizerService.normalize(newUser, {email: 'toLower', password: 'hash'}) as User;
        const currentUser: User | null = await this.userRepository.findOne({
            where: {
                email: currentUserProfile.email
            }
        });

        if (!currentUser) {
            throw new HttpErrors.NotFound('User not found');
        }
        if (updatedUser.role) {
            throw new HttpErrors.Unauthorized('You\'re not authorized to edit your own roles');
        }
        if (updatedUser.disable2FA) {
            updatedUser.twoFactorAuthenticationEnabled = false;
        }
        if (updatedUser.email) {
            if (!validator.isEmail(updatedUser.email)) {
                throw new HttpErrors.BadRequest('Invalid email.');
            }
            if (await this.userService.isEmailUsed(updatedUser.email)) {
                throw new HttpErrors.Conflict('Email already in use');
            }
            if (!redirectURL) {
                throw new HttpErrors.BadRequest('Missing redirect URL.');
            }
            if (!currentUser.role)
                throw new HttpErrors.InternalServerError();
            updatedUser.role = currentUser.role.filter((role: string) => {
                return role !== "user" && role !== "email_not_validated";
            });
            updatedUser.role.push('email_not_validated');
            updatedUser.validationToken = await this.userRepository.changeMail(updatedUser.email, redirectURL);
        }
        await this.userRepository.updateById(currentUser.id, updatedUser);
        return this.userRepository.findById(currentUser.id);
    }

    @get('/{id}', {
        responses: {
            '200': response200(User, "Return a user"),
            '404': response404('User not found')
        }
    })
    @authenticate('jwt-all')
    @authorize({allowedRoles: ['admin']})
    async getUser(
        @param.path.string('id') id: string,
        @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    ) {
        const user: User | undefined = await this.userRepository.findById(id);

        if (!user)
            throw new HttpErrors.NotFound("User not found.");
        return user;
    }

    @del('/{id}', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': 'OK',
            '404': response404('User not found'),
            '401': {
                description: 'Unauthorized'
            }
        }
    })
    @authenticate('jwt-all')
    @authorize({allowedRoles: ['admin']})
    async deleteUser(
        @param.path.string('id') id: string,
        @inject(SecurityBindings.USER) currentUserProfile: UserProfile
    ) {
        const currentUser: User | undefined = await this.userRepository.findById(id);

        if (!currentUser) {
            throw new HttpErrors.NotFound('User not found')
        }

        await this.userRepository.deleteById(id);
        return "OK";
    }

    @patch('/{id}', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': response200(User, 'Return user'),
            '404': response404('User not found'),
            '401': {
                description: 'Unauthorized'
            }
        }
    })
    @authenticate('jwt-all')
    @authorize({allowedRoles: ['admin']})
    async updateUser(
        @param.path.string('id') id: string,
        @requestBody() newUser: UpdateUserRequest,
        @inject(SecurityBindings.USER) currentUserProfile: UserProfile
    ) {
        const updatedUser: User = this.normalizerService.normalize(newUser, {email: 'toLower', password: 'hash'}) as User;
        const currentUser: User | undefined = await this.userRepository.findById(id);

        if (!currentUser) {
            throw new HttpErrors.NotFound('User not found');
        }
        if (updatedUser.email) {
            if (await this.userService.isEmailUsed(updatedUser.email)) {
                throw new HttpErrors.Conflict('Email already in use');
            }
            if (!validator.isEmail(updatedUser.email)) {
                throw new HttpErrors.BadRequest('Invalid email.');
            }
        }
        if (updatedUser.disable2FA) {
            updatedUser.twoFactorAuthenticationEnabled = false;
        }
        await this.userRepository.updateById(id, updatedUser);
        return this.userRepository.findById(id);
    }

    @post('/resetPassword', {
        responses: {
            '200': {
                description: 'Email sent if user exist'
            },
            '400': response400("Invalid email"),
            '422': response422('Invalid params', 'should have required property \'email\'')
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

        const user: User | null = await this.userRepository.findOne({where: {"email": normalizedRequest.email}});

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
            '200': response200(User, 'Password changed'),
            '404': response404('Token not found'),
            '422': response422('Invalid params', 'should have required property \'password\'')
        }
    })
    async resetPassword(@requestBody() userRequest: ValidatePasswordResetRequest) {
        const normalizedRequest: ValidatePasswordResetRequest = this.normalizerService.normalize(userRequest, {password: 'hash'}) as ValidatePasswordResetRequest;

        if (!normalizedRequest) {
            throw new HttpErrors.InternalServerError();
        }

        const user: User | null = await this.userRepository.findOne({
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
            '200': response200(User, 'Email validated'),
            '400': response400('Missing token'),
            '404': response404('Token not found')
        }
    })
    async validateAccount(
        @param.query.string('token') token?: string
    ) {
        if (!token) {
            throw new HttpErrors.BadRequest('Missing token');
        }

        const user: User | null = await this.userRepository.findOne({
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
                        schema: {
                            type: 'object',
                            properties: {
                                otpauthUrl: {
                                    type: 'string'
                                }
                            }
                        }
                    },
                },
            },
            '400': response400('2FA already activated for this account'),
            '401': response401()
        },
    })
    @authenticate('jwt-all')
    async activate2FAGenerateCode(@inject(SecurityBindings.USER) currentUserProfile: CustomUserProfile) {
        const user: User | null = await this.userRepository.getFromUserProfile(currentUserProfile);
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
            '200': response200(User, '2FA activated'),
            '400': response400('2FA already activated for this account/Invalid token'),
            '401': response401()
        },
    })
    @authenticate('jwt-all')
    async activate2FAValidateCode(
        @requestBody() userRequest: Validate2FARequest,
        @inject(SecurityBindings.USER) currentUserProfile: CustomUserProfile
    ) {
        const user: User | null = await this.userRepository.getFromUserProfile(currentUserProfile);
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
            '400': response400('2FA not activated for this account / Invalid token'),
            '401': response401()
        },
    })
    @authenticate('jwt-2fa')
    async validate2FA(
        @requestBody() userRequest: Validate2FARequest,
        @inject(SecurityBindings.USER) currentUserProfile: CustomUserProfile
    ) {
        const user: User | null = await this.userRepository.getFromUserProfile(currentUserProfile);
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
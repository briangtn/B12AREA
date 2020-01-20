import {requestBody, get, post, patch, param, api, HttpErrors} from '@loopback/rest';
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
import {EmailManager, NormalizerServiceService, RandomGeneratorManager, UserService} from '../services';
import * as url from 'url';
import {response200, response400, response404, response409, response422} from './specs/doc.specs';

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
        '422': response422('Invalid params', 'should have required property \'email\' and \'password\'')
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

        const user = await this.userService.checkCredentials(credentials);
        const token = await this.tokenService.generateToken({
            email: user.email
        } as UserProfile);

        return {token};
    }

    @get('/me', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': response200(User, 'Own profile')
        },
    })
    @authenticate('jwt')
    getMe(
    ) {
        return true;
    }

    @get('/{id}', {
        responses: {
            '200': response200(User, "Return a user"),
            '404': response404('User not found')
        }
    })
    @authenticate('jwt')
    async getUser(
        @param.path.string('id') id: string
    ) {
        const user: User | undefined = await this.userRepository.findById(id);

        if (!user)
            throw new HttpErrors.NotFound("User not found.");
        return user;
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

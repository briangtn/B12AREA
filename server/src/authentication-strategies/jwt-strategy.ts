import {AuthenticationStrategy, TokenService} from '@loopback/authentication';
import {HttpErrors, Request, RestBindings} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import {inject} from '@loopback/context';
import {TokenServiceBindings} from "../keys";

export class JWTAuthenticationStrategy implements AuthenticationStrategy {
    name = 'jwt';

    constructor(
        @inject(TokenServiceBindings.TOKEN_SERVICE)
        public tokenService: TokenService
    ) {}

    async authenticate(request: Request): Promise<UserProfile | undefined> {
        return this.tokenService.verifyToken(this.extractCredentials(request)).then((userProfile: UserProfile) => {
            return userProfile;
        }).catch((e) => {
            throw new HttpErrors.Unauthorized;
        });
    }

    extractCredentials(request: Request): string {
        if (!request.headers.authorization) {
            throw new HttpErrors.Unauthorized('Authorization header not found.');
        }

        if (!request.headers.authorization.startsWith('Bearer')) {
            throw new HttpErrors.Unauthorized('Authorization header is not of type Bearer (Must start with \'Bearer\').');
        }

        const splittedHeader = request.headers.authorization.split(' ');

        if (splittedHeader.length !== 2) {
            throw new HttpErrors.Unauthorized('Authorization header is invalid.');
        }
        return splittedHeader[1];
    }
}
import {AuthenticationStrategy, TokenService} from '@loopback/authentication';
import {HttpErrors, Request} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import {inject} from '@loopback/context';


export class JWTAuthenticationStrategy implements AuthenticationStrategy {
    name = 'jwt';

    constructor(@inject('services.authentication.jwt.tokenservice')
                public tokenService: TokenService) {}

    async authenticate(request: Request): Promise<UserProfile | undefined> {
        const profile: UserProfile = await this.tokenService.verifyToken(this.extractCredentials(request));
        return profile;
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
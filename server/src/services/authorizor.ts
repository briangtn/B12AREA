import {Provider} from '@loopback/core';
import {
    Authorizer,
    AuthorizationContext,
    AuthorizationMetadata,
    AuthorizationDecision,
} from '@loopback/authorization';
import {UserRepository} from '../repositories/user.repository';
import { repository } from '@loopback/repository';
import { User } from '../models';

// Class level authorizer
export class AreaAuthorizationProvider implements Provider<Authorizer> {
    constructor(@repository(UserRepository) public userRepository: UserRepository) {}

    /**
     * @returns authenticateFn
     */
    value(): Authorizer {
        return this.authorize.bind(this);
    }

    async authorize(
        authorizationCtx: AuthorizationContext,
        metadata: AuthorizationMetadata,
    ) {
        const roles = metadata.allowedRoles;
        const userProfile = authorizationCtx.principals[0];
        if (!userProfile)
            return AuthorizationDecision.DENY;
        const user: User | null = await this.userRepository.findOne({where: {email: userProfile.email}});
        if (!user || !user.role || user.role.length === 0)
            return AuthorizationDecision.DENY;
        if (!roles)
            return AuthorizationDecision.ALLOW;
        for (const role of roles) {
            if (user?.role?.indexOf(role) === -1) {
                return AuthorizationDecision.DENY;
            }
        }
        return AuthorizationDecision.ALLOW;
    }
}
import {bind, BindingScope, inject} from '@loopback/core';
import {TokenService} from "@loopback/authentication";
import {UserProfile} from "@loopback/security";
import {HttpErrors} from "@loopback/rest/dist";
import {TokenServiceBindings} from "../keys";
import {promisify} from "util";
import {UserRepository} from '../repositories/user.repository';
import { repository } from '@loopback/repository';

const jwt  = require("jsonwebtoken");

export interface CustomUserProfile extends UserProfile  {
    require2fa?: boolean;
    validated2fa?: boolean;
}

@bind({scope: BindingScope.TRANSIENT})
export class JWTService implements TokenService {
    constructor(
        @inject(TokenServiceBindings.TOKEN_SECRET)
        private jwtSecret: string,
        @inject(TokenServiceBindings.TOKEN_EXPIRES_IN)
        private jwtExpiresIn: string,
        @repository(UserRepository)
        private userRepository: UserRepository,
    ) {}

    generateToken(userProfile: CustomUserProfile): Promise<string> {
        if (!userProfile || !userProfile.email) {
            throw new HttpErrors.Unauthorized(
                'Error generating token: email is null',
            );
        }

        const userInfoForToken = {
            email: userProfile.email,
            require2fa: userProfile.require2fa,
            validated2fa: userProfile.validated2fa
        };

        return promisify(jwt.sign)(userInfoForToken, this.jwtSecret, {
            expiresIn: Number(this.jwtExpiresIn),
        });
    }


    verifyToken(token: string): Promise<CustomUserProfile> {
        return new Promise((resolve, reject) => {
            try {
                const profile: CustomUserProfile = jwt.verify(token, this.jwtSecret) as CustomUserProfile;
                this.userRepository.getFromUserProfile(profile).then((user) => {
                    if (!user || !user.role || user.role.indexOf("email_not_validated") !== -1) {
                        reject("Email not validated");
                        return;
                    }
                    resolve(profile)
                }).catch(err => {
                    reject(err);
                });
            } catch (e) {
                reject(e);
            }
        });
    }
}

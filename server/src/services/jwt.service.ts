import {bind, BindingScope, inject} from '@loopback/core';
import {TokenService} from "@loopback/authentication";
import {UserProfile} from "@loopback/security";
import {HttpErrors} from "@loopback/rest/dist";
import {TokenServiceBindings} from "../keys";
import {promisify} from "util";

const jwt  = require("jsonwebtoken");

@bind({scope: BindingScope.TRANSIENT})
export class JWTService implements TokenService {
    constructor(
        @inject(TokenServiceBindings.TOKEN_SECRET)
        private jwtSecret: string,
        @inject(TokenServiceBindings.TOKEN_EXPIRES_IN)
        private jwtExpiresIn: string,
    ) {}

    generateToken(userProfile: UserProfile): Promise<string> {
        if (!userProfile || !userProfile.email) {
            throw new HttpErrors.Unauthorized(
                'Error generating token: email is null',
            );
        }

        const userInfoForToken = {
            email: userProfile.email,
        };

        return promisify(jwt.sign)(userInfoForToken, this.jwtSecret, {
            expiresIn: Number(this.jwtExpiresIn),
        });
    }


    verifyToken(token: string): Promise<UserProfile> {
        return new Promise((resolve, reject) => {
            try {
                const decoded: object | string = jwt.verify(token, this.jwtSecret);
                resolve(decoded as UserProfile)
            } catch (e) {
                reject(e);
            }
        });
    }
}

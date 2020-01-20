import {bind} from '@loopback/core';
import * as speakeasy from 'speakeasy';
import {User} from "../models";

export interface TwoFactorAuthenticationSecretCode {
    otpauthUrl: string,
    base32: string
}

export interface TwoFactorAuthenticationManager {
    generate2FACode(): TwoFactorAuthenticationSecretCode;
    verify2FACode(code: string, user: User): boolean;
}

@bind({tags: {namespace: "services", name: "2fa"}})
export class TwoFactorAuthenticationService implements TwoFactorAuthenticationManager {
    constructor() {}

    generate2FACode(): TwoFactorAuthenticationSecretCode {
        const secretCode = speakeasy.generateSecret({
            name: process.env.TWO_FACTOR_AUTHENTICATION_ISSUER_NAME
        });
        return {
            otpauthUrl: secretCode.otpauth_url!,
            base32: secretCode.base32
        }
    }

    verify2FACode(code: string, user: User): boolean {
        if (!user.twoFactorAuthenticationSecret)
            return false;
        return speakeasy.totp.verify({
            secret: user.twoFactorAuthenticationSecret,
            encoding: 'base32',
            token: code,
        });
    }
}

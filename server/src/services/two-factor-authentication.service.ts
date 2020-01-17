import {bind} from '@loopback/core';
import * as speakeasy from 'speakeasy'

export interface TwoFactorAuthenticationSecretCode {
    otpauthUrl: string,
    base32: string
}

export interface TwoFactorAuthenticationManager {
    generate2FACode(): TwoFactorAuthenticationSecretCode;
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

}

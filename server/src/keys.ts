import {BindingKey} from "@loopback/context";
import {TokenService} from "@loopback/authentication";

export namespace TokenServiceConstants {
    export const TOKEN_SECRET_VALUE = process.env.AREA_JWT_SECRET_VALUE;

    export const TOKEN_EXPIRES_IN_VALUE = process.env.AREA_JWT_TTL ?? "6000";
}

export namespace TokenServiceBindings {
    export const TOKEN_SECRET = BindingKey.create<string>(
        'authentication.jwt.secret',
    );
    export const TOKEN_EXPIRES_IN = BindingKey.create<string>(
        'authentication.jwt.expires.in.seconds',
    );
    export const TOKEN_SERVICE = BindingKey.create<TokenService>(
        'services.authentication.jwt.tokenservice',
    );
}

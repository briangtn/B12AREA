import {BootMixin} from '@loopback/boot';
import {ApplicationConfig, BindingKey} from '@loopback/core';
import {
    RestExplorerBindings,
    RestExplorerComponent,
} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {MySequence} from './sequence';
import {TokenServiceBindings, TokenServiceConstants} from "./keys";
import {JWTService} from "./services";
import {AuthenticationComponent, registerAuthenticationStrategy} from "@loopback/authentication";
import {JWTAuthenticationStrategy} from "./authentication-strategies/jwt-strategy";
import {SECURITY_SCHEME_SPEC} from "./utils/security-specs";

export interface PackageInfo {
    name: string;
    version: string;
    description: string;
}
export const PackageKey = BindingKey.create<PackageInfo>('application.package');

const pkg: PackageInfo = require('../package.json');

export class AreaApplication extends BootMixin(
    ServiceMixin(RepositoryMixin(RestApplication)),
) {
    constructor(options: ApplicationConfig = {}) {
        if (options.rest)
            options.rest.port = process.env.API_PORT ? process.env.API_PORT : 3000;
        super(options);

        this.api({
            openapi: '3.0.0',
            info: {title: pkg.name, version: pkg.version},
            paths: {},
            components: {securitySchemes: SECURITY_SCHEME_SPEC},
        });

        // Set up the custom sequence
        this.sequence(MySequence);

        // Set up default home page
        this.static('/', path.join(__dirname, '../public'));

        this.setUpBindings();
        this.component(RestExplorerComponent);
        this.component(AuthenticationComponent);

        registerAuthenticationStrategy(this, JWTAuthenticationStrategy);

        this.projectRoot = __dirname;
        // Customize @loopback/boot Booter Conventions here
        this.bootOptions = {
            controllers: {
                // Customize ControllerBooter Conventions here
                dirs: ['controllers'],
                extensions: ['.controller.js'],
                nested: true,
            },
        };
    }

    setUpBindings(): void {
        this.bind(RestExplorerBindings.CONFIG).to({
            path: '/explorer',
        });

        this.bind(PackageKey).to(pkg);

        if (TokenServiceConstants.TOKEN_SECRET_VALUE == undefined)
            throw "Please provide a secret value to generate JsonWebToken using the AREA_JWT_SECRET_VALUE environment variable";
        this.bind(TokenServiceBindings.TOKEN_SECRET).to(
            TokenServiceConstants.TOKEN_SECRET_VALUE,
        );

        this.bind(TokenServiceBindings.TOKEN_EXPIRES_IN).to(
            TokenServiceConstants.TOKEN_EXPIRES_IN_VALUE,
        );

        this.bind(TokenServiceBindings.TOKEN_SERVICE).toClass(JWTService);
    }
}

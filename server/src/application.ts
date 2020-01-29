import {BootMixin} from '@loopback/boot';
import {ApplicationConfig, BindingKey} from '@loopback/core';
import {
    RestExplorerBindings,
    RestExplorerComponent,
} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication, api} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {MySequence} from './sequence';
import {TokenServiceBindings, TokenServiceConstants} from "./keys";
import {JWTService} from "./services";
import {AuthenticationComponent, registerAuthenticationStrategy} from "@loopback/authentication";
import {JWTAllAuthenticationStrategy, JWT2FAAuthenticationStrategy} from "./authentication-strategies";
import {SECURITY_SCHEME_SPEC} from "./utils/security-specs";
import * as fs from 'fs';

export interface PackageInfo {
    name: string;
    version: string;
    description: string;
}

export const PackageKey = BindingKey.create<PackageInfo>('application.package');

export class AreaApplication extends BootMixin(
    ServiceMixin(RepositoryMixin(RestApplication)),
) {
    constructor(options: ApplicationConfig = {}) {
        if (options.rest)
            options.rest.port = process.env.API_PORT ? process.env.API_PORT : 3000;
        super(options);

        this.api({
            openapi: '3.0.0',
            info: {title: "AREA", version: "1.0"},
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

        registerAuthenticationStrategy(this, JWTAllAuthenticationStrategy);
        registerAuthenticationStrategy(this, JWT2FAAuthenticationStrategy);

        this.projectRoot = __dirname;
        this.loadAuthControllers();
        // Customize @loopback/boot Booter Conventions here
        this.bootOptions = {
            controllers: {
                // Customize ControllerBooter Conventions here
                dirs: ['controllers', 'area-services'],
                extensions: ['.controller.js', '.lb-controller.js'],
                nested: true,
            },
        };
    }

    setUpBindings(): void {
        this.bind(RestExplorerBindings.CONFIG).to({
            path: '/explorer',
        });

        if (TokenServiceConstants.TOKEN_SECRET_VALUE === undefined)
            throw Error("Please provide a secret value to generate JsonWebToken using the AREA_JWT_SECRET_VALUE environment variable");
        this.bind(TokenServiceBindings.TOKEN_SECRET).to(
            TokenServiceConstants.TOKEN_SECRET_VALUE,
        );

        this.bind(TokenServiceBindings.TOKEN_EXPIRES_IN).to(
            TokenServiceConstants.TOKEN_EXPIRES_IN_VALUE,
        );

        this.bind(TokenServiceBindings.TOKEN_SERVICE).toClass(JWTService);
    }

    loadAuthControllers() {
        fs.readdir(path.join(__dirname + '/area-auth-services'), (err, dirs) => {
            if (err)
                return console.log(err);
            for (const dirIndex in dirs) {
                const dir = dirs[dirIndex];
                import('./area-auth-services/' + dir + '/controller').then(module => {
                    @api({basePath: '/auth-services/' + dir, paths: {}})
                    class AuthServices extends module.default {

                    }

                    this.controller(AuthServices, dir);
                }).catch(error => {
                    return console.log(error);
                });
            }
        });

    }
}

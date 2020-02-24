import {bind, inject} from '@loopback/core';
import {Credentials, UserRepository} from "../repositories/user.repository";
import {User} from "../models";
import {repository} from "@loopback/repository";
import {HttpErrors, Request} from "@loopback/rest";
import {CustomUserProfile} from './jwt.service';
import {JWTAllAuthenticationStrategy} from '../authentication-strategies';

@bind({tags: {namespace: "services", name: "user"}})
export class UserService {
    constructor(/* Add @inject to inject parameters */
                @repository(UserRepository) public userRepository: UserRepository,
                @inject('auth.jwt-all') protected authStrategy: JWTAllAuthenticationStrategy
    ) {}

    /*
     * Add service methods here
     */
    async checkCredentials(credentials: Credentials) : Promise<User> {
        const user = await this.userRepository.findOne(
            {
                where: {
                    email: credentials.email,
                    password: credentials.password
                }
            }
        );
        if (!user)
            throw new HttpErrors.Unauthorized('Invalid email or password');
        if (!user.role || user.role.indexOf("email_not_validated") !== -1)
            throw new HttpErrors.Unauthorized("Email not validated");
        return user;
    }

    async getUserProfile(request: Request): Promise<CustomUserProfile | undefined> {
        try {
            return await this.authStrategy.tokenService.verifyToken(this.authStrategy.extractCredentials(request));
        } catch (e) {
            throw new HttpErrors.Unauthorized();
        }
    }

    async isEmailUsed(email: string): Promise<boolean> {
        const user = await this.userRepository.findOne({
            where: {
                email: email
            }
        });

        return user !== undefined && user !== null;
    }

    getServiceLoginData(user: User, serviceName: string) {
        const services = user.services;
        if (!services) {
            return null;
        }

        for (const service of services) {
            const serviceTyped: {name:string} = service as {name: string};

            if (serviceTyped.name === serviceName) {
                return service;
            }
        }
        return null;
    }

    getAvailableRoles(): string[] {
        return [
            "user",
            "admin",
            "email_not_validated"
        ]
    }
}

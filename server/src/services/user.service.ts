import {bind, inject} from '@loopback/core';
import {Credentials, UserRepository} from "../repositories/user.repository";
import {User} from "../models";
import {repository} from "@loopback/repository";
import {HttpErrors} from "@loopback/rest/dist";

@bind({tags: {namespace: "services", name: "user"}})
export class UserService {
    constructor(/* Add @inject to inject parameters */
                @repository(UserRepository) public userRepository: UserRepository,
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
        return user;
    }

    async isEmailUsed(email: string): Promise<boolean> {
        const user = await this.userRepository.findOne({
            where: {
                email: email
            }
        });

        return user !== undefined && user !== null;
    }
}

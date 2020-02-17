import {bind, inject} from '@loopback/core';
import { repository } from '@loopback/repository';
import {UserRepository} from '../repositories/user.repository';
import {CustomUserProfile, ExchangeCodeGeneratorManager} from '.';
import {User} from '../models';
import {TokenServiceBindings} from '../keys';
import { TokenService } from '@loopback/authentication';

interface LoginOrRegisterData {
    serviceName: string,
    serviceAccountId: string,
    email?: string,
    userID?: string
}

@bind({tags: {namespace: "services", name: "areaAuthService"}})
export class AreaAuthServiceService {
    constructor(@repository(UserRepository) public userRepository: UserRepository,
                @inject(TokenServiceBindings.TOKEN_SERVICE) protected tokenService: TokenService,
                @inject('services.exchangeCodeGenerator') protected exchangeCodeGenerator: ExchangeCodeGeneratorManager) {}

    async loginOrRegister(data: LoginOrRegisterData): Promise<string> {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises,no-async-promise-executor
        return new Promise<string>(async (resolve, reject) => {
            if (data.userID) {
                const user: User | null = await this.userRepository.findById(data.userID);
                const userAlreadyConnected: User | null = await this.findUser(data);

                if (userAlreadyConnected) {
                    return resolve(await this.exchangeCodeGenerator.generate({error: 'Another user is already linked to this service account'}, true));
                }
                if (!user)
                    return reject("User not found.");
                if (!user.authServices)
                    return reject("User service not found that should never happens");

                user.authServices.push({name: data.serviceName, accountID: data.serviceAccountId});
                await this.userRepository.update(user);
                resolve(await this.exchangeCodeGenerator.generate({message: 'User is linked to the service'}, true));
                return;
            }

            const user: User | null = await this.findUser(data);

            if (!user) {
                if (!data.email) {
                    return resolve(this.exchangeCodeGenerator.generate({
                        error: 'This app accept only services with email for registration.',
                    }, true));
                }
                if (!(await this.register(data))) {
                    return resolve(this.exchangeCodeGenerator.generate({error: 'Account already exist with this email.'}, true));
                }
            }
            return resolve(this.exchangeCodeGenerator.generate(await this.login(data), true));
        });
    }

    async login(data: LoginOrRegisterData): Promise<object> {
        const user: User | null = await this.findUser(data);

        if (!user) {
            return {error: 'User connected with this service not found.'};
        }
        const token = await this.tokenService.generateToken({
            email: user.email,
            require2fa: false,
            validated2fa: false
        } as CustomUserProfile);
        return {token, require2fa: false};
    }

    async register(data: LoginOrRegisterData): Promise<boolean> {
        const user: User | null = await this.userRepository.findOne({where: {email: data.email}});
        const userWithThisService: User | null = await this.findUser(data);

        if (user || userWithThisService || !data.email) {
            return false;
        }
        await this.userRepository.create({email: data.email, role: ['user'], twoFactorAuthenticationEnabled: false, authServices: [{name: data.serviceName, accountID: data.serviceAccountId}]});
        return true;
    }

    private async findUser(data: LoginOrRegisterData): Promise<User |null> {
        const users: User[] = await this.userRepository.find();
        return users.filter((currentUser) => {
            return currentUser.authServices && currentUser.authServices.filter((service) => {
                const currentService: {name: string, accountID: string} = service as {name: string, accountID: string};
                return currentService.name === data.serviceName && currentService.accountID === data.serviceAccountId;
            }).length > 0;
        })[0];
    }

}

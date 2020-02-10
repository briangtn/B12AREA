import {bind, inject} from '@loopback/core';
import { repository } from '@loopback/repository';
import {UserRepository} from '../repositories/user.repository';
import {CustomUserProfile, ExchangeCodeGeneratorManager} from '.';
import {User} from '../models';
import {TokenServiceBindings} from '../keys';
import { TokenService } from '@loopback/authentication';

@bind({tags: {namespace: "services", name: "areaAuthService"}})
export class AreaAuthServiceService {
    constructor(@repository(UserRepository) public userRepository: UserRepository,
                @inject(TokenServiceBindings.TOKEN_SERVICE) protected tokenService: TokenService,
                @inject('services.exchangeCodeGenerator') protected exchangeCodeGenerator: ExchangeCodeGeneratorManager) {}

    async loginOrRegister(serviceName: string, email: string): Promise<string> {
        const user: User | null = await this.userRepository.findOne({where: {email}});

        console.log("slt0");
        if (!user) {
            console.log("slt");
            if (!(await this.register(serviceName, email))) {
                console.log("slt2");
                return this.exchangeCodeGenerator.generate({error: 'Account already exist with this email.'}, true);
            }
            console.log("slt3");
        }
        console.log("slt4");
        return this.exchangeCodeGenerator.generate(await this.login(serviceName, email), true);
    }

    async login(serviceName: string, email: string): Promise<object> {
        const user: User | null = await this.userRepository.findOne({where: {email}});

        if (!user) {
            return {error: 'User with this email not found.'};
        }
        if (user.authServices?.indexOf(serviceName) !== -1) {
            const token = await this.tokenService.generateToken({
                email: user.email,
                require2fa: user.twoFactorAuthenticationEnabled,
                validated2fa: false
            } as CustomUserProfile);
            return {token, require2fa: user.twoFactorAuthenticationEnabled};
        }
        return {error: 'This account is not connected with this service.'}
    }

    async register(serviceName: string, email: string): Promise<boolean> {
        const user: User | null = await this.userRepository.findOne({where: {email}});

        if (user) {
            return false;
        }
        await this.userRepository.create({email, role: ['user'], twoFactorAuthenticationEnabled: false, authServices: [serviceName]})
        return true;
    }

}

import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {User, UserRelations, Area} from '../models';
import {MongoDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {AreaRepository} from './area.repository';
import {EmailManager, RandomGeneratorManager} from '../services';
import {UserProfile} from "@loopback/security";
import * as url from 'url';

export type Credentials = {
    email: string;
    password: string;
};

export class UserRepository extends DefaultCrudRepository<User,
    typeof User.prototype.id,
    UserRelations> {

    public readonly areas: HasManyRepositoryFactory<Area, typeof User.prototype.id>;

    constructor(
        @inject('datasources.mongo') dataSource: MongoDataSource, @repository.getter('AreaRepository') protected areaRepositoryGetter: Getter<AreaRepository>,
        @inject('services.email') protected emailService: EmailManager,
        @inject('services.randomGenerator') protected randomGeneratorService: RandomGeneratorManager
    ) {
        super(User, dataSource);
        this.areas = this.createHasManyRepositoryFactoryFor('areas', areaRepositoryGetter,);
        this.registerInclusionResolver('areas', this.areas.inclusionResolver);
    }

    async validateEmail(userId: string): Promise<User | null> {
        const user: User | null = await this.findById(userId);
        if (!user)
            return null;
        const newRoles = user.role?.filter((role: string) => {
            return role !== 'email_not_validated' && role !== 'user'
        });
        if (newRoles)
            newRoles.push('user');
        await this.updateById(userId, {
            validationToken: undefined,
            role: newRoles
        });
        return this.findById(userId);
    }

    async changeMail(email: string, redirectURL: string): Promise<string> {
        const validationToken: string = this.randomGeneratorService.generateRandomString(24);

        const parsedURL: url.UrlWithStringQuery = url.parse(redirectURL);
        let endURL: string = parsedURL.protocol + '//' + parsedURL.host + parsedURL.pathname;
        if (parsedURL.search) {
            endURL += parsedURL.search + "&token=" + validationToken;
        } else {
            endURL += "?token=" + validationToken;
        }
        const templateParams: Object = {
            redirectURL: endURL
        };
        const htmlData: string = await this.emailService.getHtmlFromTemplate("emailValidation", templateParams);
        const textData: string = await this.emailService.getTextFromTemplate("emailValidation", templateParams);
        this.emailService.sendMail({
            from: "AREA <noreply@b12powered.com>",
            to: email,
            subject: "Welcome to AREA",
            html: htmlData,
            text: textData
        }).catch(e => console.error("Failed to deliver email validation email: ", e));
        return validationToken;
    }

    async updatePassword(userId: string, password: string): Promise<User | null> {
        const user: User | null = await this.findById(userId);
        if (!user)
            return null;

        const htmlData: string = await this.emailService.getHtmlFromTemplate("passwordValidateReset", {});
        const textData: string = await this.emailService.getTextFromTemplate("passwordValidateReset", {});

        await this.updateById(userId, {
            password: password,
            resetToken: undefined
        });
        this.emailService.sendMail({
            from: "AREA <noreply@b12powered.com>",
            to: user.email,
            subject: "Password changed",
            html: htmlData,
            text: textData
        }).catch(e => console.error("Failed to deliver password reset validation email: ", e));
        return this.findById(userId);
    }

    async getFromUserProfile(userProfile: UserProfile): Promise<User|null> {
        return this.findOne({
            where: {
                email: userProfile.email
            }
        });
    }

    async addService(userId: typeof User.prototype.id, data: object) {
        const user: User = await this.findById(userId)!;
        user.services!.push(data);
        await this.update(user);
    }

    async createArea(userId: typeof User.prototype.id, area: Omit<Area, 'id'>) : Promise<Area> {
        return this.areas(userId).create(area);
    }
}
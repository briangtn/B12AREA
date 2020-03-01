import {
    DefaultCrudRepository,
    HasManyRepositoryFactory,
    repository,
    juggler,
    AnyObject,
    Condition, AndClause, OrClause, Count
} from '@loopback/repository';
import {Area, User, UserRelations} from '../models';
import {MongoDataSource} from '../datasources';
import {Getter, inject} from '@loopback/core';
import {AreaRepository} from './area.repository';
import {EmailManager, RandomGeneratorManager} from '../services';
import {UserProfile} from '@loopback/security';
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
        @inject('datasources.mongo') dataSource: MongoDataSource,
        @repository.getter('AreaRepository') protected areaRepositoryGetter: Getter<AreaRepository>,
        @inject('services.email') protected emailService: EmailManager,
        @inject('services.randomGenerator') protected randomGeneratorService: RandomGeneratorManager
    ) {
        super(User, dataSource);
        this.areas = this.createHasManyRepositoryFactoryFor('areas', areaRepositoryGetter,);
        this.registerInclusionResolver('areas', this.areas.inclusionResolver);
    }

    async deleteById(id: typeof User.prototype.id, options?: AnyObject): Promise<void> {
        const user = await this.findById(id);
        await this.areas(user.email).delete();
        return super.deleteById(id, options);
    }

    async deleteAll(where?: Condition<User> | AndClause<User> | OrClause<User>, options?: AnyObject): Promise<Count> {
        const users = await this.find({
            where: where
        }, options);
        for (const user of users) {
            await this.areas(user.email).delete();
        }
        return super.deleteAll(where, options);
    }

    toEntity<R extends User>(model: juggler.PersistedModel) {
        const entity: R & {servicesList: string[]} = super.toEntity(model);

        if (!entity.services) {
            entity.servicesList = [];
        }
        entity.servicesList = Object.keys(entity.services!);
        return entity;
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

    async addService(userId: typeof User.prototype.id, data: object, serviceName: string) {
        const user: User = await this.findById(userId)!;
        user.services![serviceName as keyof typeof user.services] = data as never;
        await this.update(user);
    }

    async getServiceInformation(userID: typeof User.prototype.id, serviceName: string): Promise<object> {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises,no-async-promise-executor
        return new Promise<object>(async (resolve, reject) => {
            const user : User = await this.findById(userID)!;
            const service: object = user.services![serviceName as keyof typeof user.services]!;
            return resolve(service);
        });
    }

    async createArea(userId: typeof User.prototype.id, area: Omit<Area, 'id'>) : Promise<Area> {
        return this.areas(userId).create(area);
    }
}
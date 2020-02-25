import {LoginObject, ServiceConfig} from '../../services-interfaces';
import config from './config.json';
import {param, get, Response, RestBindings} from "@loopback/rest";
import {Context, inject} from "@loopback/context";
import {AreaAuthServiceService, ExchangeCodeGeneratorManager} from '../../services';
import {HttpErrors} from "@loopback/rest/dist";
import {UserRepository} from '../../repositories';
import { repository } from "@loopback/repository";
import {User} from '../../models';
import {TwitterHelper} from './helper';

export default class TwitterServiceController {

    constructor(@inject('services.exchangeCodeGenerator') protected exchangeCodeGenerator: ExchangeCodeGeneratorManager,
                @inject(RestBindings.Http.RESPONSE) public response: Response,
                @inject('services.areaAuthService') public authenticator: AreaAuthServiceService,
                @repository(UserRepository) public userRepository: UserRepository) {
    }

    static async start(ctx: Context): Promise<void> {
    }

    static async login(params: LoginObject) {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises,no-async-promise-executor
        return new Promise<string | null>(async (resolve, reject) => {
            const exchangeCodeGenerator: ExchangeCodeGeneratorManager = await params.ctx.get('services.exchangeCodeGenerator');
            const userRepository: UserRepository = await params.ctx.get('repositories.UserRepository');
            const user : User = (await userRepository.findOne({where: {email: params.user.email}}))!;

            if (await userRepository.getServiceInformation(user.id, 'twitter')) {
                const codeParam = await exchangeCodeGenerator.generate({status: 'Authenticated with twitter'}, true);
                return params.redirectUrl + '?code=' + codeParam;
            }
            const state = await exchangeCodeGenerator.generate({url: params.redirectUrl}, false);
            const consumer = TwitterHelper.getConsumer(state);

            consumer.getOAuthRequestToken(async (err, token, secret) => {
                if (err) {
                    console.log("Error", err);
                    reject(err);
                } else {
                    await exchangeCodeGenerator.updateData(state, {url: params.redirectUrl, token, secret, userID: user.id});

                    resolve("https://twitter.com/oauth/authorize?oauth_token=" + token);
                }
            });
        });
    }

    @get('/auth')
    async auth(
        @param.query.string('oauth_token') oauthToken: string,
        @param.query.string('oauth_verifier') oauthVerifier: string,
        @param.query.string('state') state: string
    ): Promise<object> {
        if (!oauthVerifier)
            throw new HttpErrors.BadRequest("Oauth verifier required");
        if (!state)
            throw new HttpErrors.BadRequest("State required");

        const consumer = TwitterHelper.getConsumer(state);

        return new Promise((resolve, reject) => {
            this.exchangeCodeGenerator.getData(state, false, true).then((dataFromCode) => {
                if (!dataFromCode) {
                    reject('Invalid state code');
                    return;
                }
                const dataTyped: {url: string, token: string, secret: string, userID: string} = dataFromCode! as {url: string, token: string, secret: string, userID: string};
                if (!consumer) {
                    reject("Invalid consumer");
                    return;
                }
                consumer.getOAuthAccessToken(dataTyped.token, dataTyped.secret, oauthVerifier, async (err, accessToken, accessTokenSecret) => {
                    if (err) {
                        try {
                            const responseCode = await this.exchangeCodeGenerator.generate({
                                error: 'Problem when fetching twitter.com',
                                info: err
                            }, true);
                            this.response.redirect(dataTyped.url + '?code=' + responseCode);
                        } catch (e) {
                            console.log(e);
                            reject(e);
                        }
                        return;
                    }
                    try {
                        await this.userRepository.addService(dataTyped.userID, {
                            accessToken: accessToken,
                            accessTokenSecret: accessTokenSecret
                        }, 'twitter')
                    } catch (e) {
                        const codeParam = await this.exchangeCodeGenerator.generate({error: 'Failed to store twitter token', info: e}, true);
                        return this.response.redirect(dataTyped.url + '?code=' + codeParam);
                    }
                    const codeParam = await this.exchangeCodeGenerator.generate({status: 'Authenticated with twitter'}, true);
                    return this.response.redirect(dataTyped.url + '?code=' + codeParam);
                });
            }).catch((err) => {
                console.log(err);
                resolve(err);
            });
        });
    }

    static async getConfig(): Promise<ServiceConfig> {
        return config;
    }
}


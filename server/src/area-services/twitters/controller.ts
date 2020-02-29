import {LoginObject, ServiceConfig} from '../../services-interfaces';
import config from './config.json';
import {param, get, Response, RestBindings, post, requestBody, put} from "@loopback/rest";
import {Context, inject} from "@loopback/context";
import {AreaAuthServiceService, ExchangeCodeGeneratorManager} from '../../services';
import {HttpErrors} from "@loopback/rest";
import {UserRepository} from '../../repositories';
import { repository } from "@loopback/repository";
import {User} from '../../models';
import {TwitterHelper} from './helper';
import crypto from 'crypto';
import { authenticate } from '@loopback/authentication';
import { authorize } from '@loopback/authorization';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-specs';

export default class TwitterServiceController {

    constructor(@inject('services.exchangeCodeGenerator') protected exchangeCodeGenerator: ExchangeCodeGeneratorManager,
                @inject(RestBindings.Http.RESPONSE) public response: Response,
                @inject('services.areaAuthService') public authenticator: AreaAuthServiceService,
                @repository(UserRepository) public userRepository: UserRepository,
                @inject.context() private ctx: Context) {
    }

    static async start(ctx: Context): Promise<void> {

        const currentWebhook = await TwitterHelper.getCurrentWebhook(ctx) as {id: string, url: string};
        if (currentWebhook && currentWebhook.url !== TwitterHelper.getWebhookUrl()) {
            await TwitterHelper.refreshWebhook(currentWebhook.id,  ctx);
        } else if (!currentWebhook) {
            await TwitterHelper.createWebhook(ctx);
        }
    }

    static async login(params: LoginObject) {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises,no-async-promise-executor
        return new Promise<string | null>(async (resolve, reject) => {
            const exchangeCodeGenerator: ExchangeCodeGeneratorManager = await params.ctx.get('services.exchangeCodeGenerator');
            const userRepository: UserRepository = await params.ctx.get('repositories.UserRepository');
            const user : User = (await userRepository.findOne({where: {email: params.user.email}}))!;

            if (await userRepository.getServiceInformation(user.id, 'twitters')) {
                const codeParam = await exchangeCodeGenerator.generate({status: 'Authenticated with twitter'}, true);
                return params.redirectUrl + '?code=' + codeParam;
            }
            const state = await exchangeCodeGenerator.generate({url: params.redirectUrl}, false);
            const consumer = TwitterHelper.getTwitter(state);

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

        const consumer = TwitterHelper.getTwitter(state);

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
                    consumer.get("https://api.twitter.com/1.1/account/verify_credentials.json", accessToken, accessTokenSecret, async (error, data) => {
                        if (error) {
                            try {
                                const responseCode = await this.exchangeCodeGenerator.generate({
                                    error: 'Problem when fetching twitter verify credentials',
                                    info: error
                                }, true);
                                this.response.redirect(dataTyped.url + '?code=' + responseCode);
                            } catch (e) {
                                console.log(e);
                                reject(e);
                            }
                            return;
                        }
                        const dataParsed = JSON.parse(data as string);

                        try {
                            try {
                                const subscribeData = await TwitterHelper.createWebhookFromTwitterClient(accessToken, accessTokenSecret);
                                console.log(subscribeData);
                            } catch (e) {
                                console.error(e);
                            }
                            console.log(data);
                            await this.userRepository.addService(dataTyped.userID, {
                                accessToken: accessToken,
                                accessTokenSecret: accessTokenSecret,
                                twitterID: dataParsed.id_str
                            }, 'twitters');
                            await TwitterHelper.subscribeWebhook(dataTyped.userID, this.ctx);
                        } catch (e) {
                            const codeParam = await this.exchangeCodeGenerator.generate({
                                error: 'Failed to store twitter token',
                                info: e
                            }, true);
                            return this.response.redirect(dataTyped.url + '?code=' + codeParam);
                        }
                    });
                    const codeParam = await this.exchangeCodeGenerator.generate({status: 'Authenticated with twitter'}, true);
                    return this.response.redirect(dataTyped.url + '?code=' + codeParam);
                });
            }).catch((err) => {
                console.log(err);
                resolve(err);
            });
        });
    }

    @post('/webhook')
    async whook(@requestBody({}) request: {for_user_id: string}) {
        const users = await this.userRepository.find();

        for (const user of users) {
            const twitterID = (user.services! as {twitters: {twitterID: string}}).twitters.twitterID;
            if ('twitters' in user.services! && twitterID === request.for_user_id) {
                await TwitterHelper.triggerActionEvent(request, user.email!, user.id!, this.ctx);
            }
        }
    }

    @get('/webhook')
    async whookChallenge(@param.query.string('crc_token') crcToken?: string) {
        if (!crcToken)
            throw new HttpErrors.BadRequest('Please provide a crc_token params');

        const hmac = crypto.createHmac('sha256', TwitterHelper.getConsumerKeys().consumerSecret);
        const hash = hmac.update(crcToken).digest('base64');

        return {
            // eslint-disable-next-line @typescript-eslint/camelcase
            response_token: `sha256=${hash}`
        }
    }

    @put('/unsubscribeUser', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': {
                description: 'All users',
            },
        }
    })

    @authenticate('jwt-all')
    @authorize({allowedRoles: ['admin']})
    async unsubscribeUser(@param.query.string('userID') userID?: string) {
        if (!userID) {
            const users = await this.userRepository.find();

            for (const user of users) {
                if (('twitters' in user.services!)) {
                    await TwitterHelper.unsubscribeWebhook(user.id!, this.ctx);
                }
            }

            return {message: 'All users was unsubscribed from twitter webhooks'};
        }
        await TwitterHelper.unsubscribeWebhook(userID, this.ctx);
        return {message: 'User unsubscribed'};
    }

    static async getConfig(): Promise<ServiceConfig> {
        return config;
    }
}


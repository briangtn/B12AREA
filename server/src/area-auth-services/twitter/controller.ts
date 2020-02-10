import {AreaAuthServiceService, ExchangeCodeGeneratorManager} from '../../services';
import { inject, Context } from '@loopback/context';
import { RestBindings, Response, get, param, HttpErrors } from '@loopback/rest';
import * as oauth from 'oauth';

export default class TwitterController {

    constructor(@inject('services.exchangeCodeGenerator') protected exchangeCodeGenerator: ExchangeCodeGeneratorManager,
                @inject(RestBindings.Http.RESPONSE) public response: Response,
                @inject('services.areaAuthService') public authenticator: AreaAuthServiceService) {
    }

    static async login(finalRedirect: string, ctx: Context) {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises,no-async-promise-executor
        return new Promise<string | null>(async (resolve, reject) => {
            const baseApiURl = process.env.API_URL;
            const redirectURL = baseApiURl + '/auth-services/twitter/auth';
            const consumerKey = process.env.TWITTER_CONSUMER_KEY ? process.env.TWITTER_CONSUMER_KEY :  "";
            const consumerSecret = process.env.TWITTER_CONSUMER_SECRET ? process.env.TWITTER_CONSUMER_SECRET : "";

            const exchangeCodeGenerator: ExchangeCodeGeneratorManager = await ctx.get('services.exchangeCodeGenerator');
            const state = await exchangeCodeGenerator.generate({url: finalRedirect}, false);
            const consumer = new oauth.OAuth(
                "https://twitter.com/oauth/request_token",
                "https://twitter.com/oauth/access_token",
                consumerKey, consumerSecret, "1.0A", redirectURL + '?state=' + state, "HMAC-SHA1"
            );

            consumer.getOAuthRequestToken(async (err, token, secret) => {
                if (err) {
                    console.log("Error", err);
                    reject(err);
                } else {
                    await exchangeCodeGenerator.updateData(state, {url: finalRedirect, token, secret});

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

        const baseApiURl = process.env.API_URL;
        const redirectURL = baseApiURl + '/auth-services/twitter/auth';
        const consumerKey = process.env.TWITTER_CONSUMER_KEY ? process.env.TWITTER_CONSUMER_KEY :  "";
        const consumerSecret = process.env.TWITTER_CONSUMER_SECRET ? process.env.TWITTER_CONSUMER_SECRET : "";

        const consumer = new oauth.OAuth(
            "https://twitter.com/oauth/request_token",
            "https://twitter.com/oauth/access_token",
            consumerKey, consumerSecret, "1.0A", redirectURL + '?state=' + state, "HMAC-SHA1"
        );
        return new Promise((resolve, reject) => {
            this.exchangeCodeGenerator.getData(state, false, true).then((dataFromCode) => {
                if (!dataFromCode) {
                    reject('Invalid state code');
                    return;
                }
                const dataTyped: {url: string, token: string, secret: string} = dataFromCode! as {url: string, token: string, secret: string};
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

                    if (!consumer) {
                        reject("Invalid consumer");
                        return;
                    }

                    consumer.get("https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true", accessToken, accessTokenSecret, async (error, data) => {
                        if (err) {
                            try {
                                const responseCode = await this.exchangeCodeGenerator.generate({
                                    error: 'Problem when fetching twitter verify credentials',
                                    info: err
                                }, true);
                                this.response.redirect(dataTyped.url + '?code=' + responseCode);
                            } catch (e) {
                                console.log(e);
                                reject(e);
                            }
                            return;
                        }
                        const dataParsed = JSON.parse(data as string);

                        if (!dataParsed.email) {
                            try {
                                const responseCode = await this.exchangeCodeGenerator.generate({
                                    error: 'This app accept only account with email.',
                                }, true);
                                this.response.redirect(dataTyped.url + '?code=' + responseCode);
                            } catch (e) {
                                console.log(e);
                                reject(e);
                            }
                            return;
                        }

                        try {
                            const responseCode = await this.authenticator.loginOrRegister('twitter', dataParsed.email);
                            this.response.redirect(dataTyped.url + '?code=' + responseCode);
                        } catch (e) {
                            console.log(e);
                            reject(e);
                        }
                    });
                });
            }).catch((err) => {
                console.log(err);
                resolve(err);
            });
        });
    }
}
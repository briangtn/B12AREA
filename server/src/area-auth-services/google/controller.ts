import { get, param, RestBindings, Response } from '@loopback/rest';
import axios from 'axios';
import {AreaAuthServiceService, ExchangeCodeGeneratorManager} from '../../services';
import { inject, Context } from '@loopback/context';

export default class GoogleController {

    constructor(@inject('services.exchangeCodeGenerator') protected exchangeCodeGenerator: ExchangeCodeGeneratorManager,
                @inject(RestBindings.Http.RESPONSE) public response: Response,
                @inject('services.areaAuthService') public authenticator: AreaAuthServiceService) {
    }

    static async login(finalRedirect: string, ctx: Context) {
        const baseApiURl = process.env.API_URL;
        const redirectURL = baseApiURl + '/auth-services/google/auth';
        const clientID = process.env.GOOGLE_CLIENT_ID;

        const exchangeCodeGenerator: ExchangeCodeGeneratorManager = await ctx.get('services.exchangeCodeGenerator');
        const state = await exchangeCodeGenerator.generate({url: finalRedirect}, false);

        let url = 'https://accounts.google.com/o/oauth2/v2/auth';
        url += '?scope=email';
        url += '&access_type=online';
        url += '&redirect_uri=' + redirectURL;
        url += '&response_type=code';
        url += '&client_id=' + clientID;
        url += '&state=' + state;
        return url;
    }

    @get('/auth')
    auth(@param.query.string('code') code: string, @param.query.string('state') state: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const baseApiURl = process.env.API_URL;
            const redirectURL = baseApiURl + '/auth-services/google/auth';
            const clientID = process.env.GOOGLE_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

            this.exchangeCodeGenerator.getData(state, false, true).then((dataFromCode) => {
                if (!dataFromCode) {
                    reject('Invalid state code');
                }
                const dataWithUrl: {url: string} = dataFromCode! as {url: string};
                if (!dataWithUrl) {
                    reject('Invalid format for data');
                }
                axios.post('https://www.googleapis.com/oauth2/v4/token', {
                    code,
                    // Disabled because this format is required by google api
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    client_id: clientID,
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    client_secret: clientSecret,
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    redirect_uri: redirectURL,
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    grant_type: 'authorization_code',
                }).then((response) => {

                    const googleAuthHeader = response.data.token_type + ' ' + response.data.access_token;

                    axios.get('https://openidconnect.googleapis.com/v1/userinfo', {headers: {Authorization: googleAuthHeader}}).then(async (profileReponse) => {
                        try {
                            const responseCode = await this.authenticator.loginOrRegister('google', profileReponse.data.email);
                            this.response.redirect(dataWithUrl.url + '?code=' + responseCode);
                        } catch (e) {
                            console.log(e);
                            reject(e);
                        }
                    }).catch(async (err) => {
                        try {
                            const responseCode = await this.exchangeCodeGenerator.generate({
                                error: 'Problem when fetching google.com profile',
                                info: err.config
                            }, true);
                            this.response.redirect(dataWithUrl.url + '?code=' + responseCode);
                        } catch (e) {

                            console.log(e);
                            reject(e);
                        }
                    });
                }).catch(async (err) => {
                    try {
                        console.log(dataFromCode);
                        const responseCode = await this.exchangeCodeGenerator.generate({
                            error: 'Problem when fetching google.com',
                            info: err.config
                        }, true);
                        this.response.redirect(dataWithUrl.url + '?code=' + responseCode);
                    } catch (e) {
                        console.log(e);
                        reject(e);
                    }
                });
            }).catch((err) => {
                console.log(err);
                reject(err);
            });
        })

    }

}

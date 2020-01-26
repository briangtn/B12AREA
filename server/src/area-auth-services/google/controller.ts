import { get, param } from '@loopback/rest';

export default class GoogleController {

    constructor() {

    }

    static login(finalRedirect: string) {
        const baseApiURl = process.env.API_URL;
        const redirectURL = baseApiURl + '/auth-services/google/auth';
        const clientID = process.env.GOOGLE_CLIENT_ID;


        let url = 'https://accounts.google.com/o/oauth2/v2/auth';
        url += '?scope=email';
        url += '&access_type=online';
        url += '&redirect_uri=' + redirectURL;
        url += '&response_type=code';
        url += '&client_id=' + clientID;

        return url;
    }

    @get('/auth')
    auth(@param.query.string('code') code: string) {

    }

}

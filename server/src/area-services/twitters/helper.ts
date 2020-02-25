import * as oauth from 'oauth';

export class TwitterHelper {
    static getConsumer(state = "") {
        const baseApiURl = process.env.API_URL;
        const redirectURL = baseApiURl + '/services/twitter/auth';
        const consumerKey = process.env.TWITTER_CONSUMER_KEY ? process.env.TWITTER_CONSUMER_KEY :  "";
        const consumerSecret = process.env.TWITTER_CONSUMER_SECRET ? process.env.TWITTER_CONSUMER_SECRET : "";

        return new oauth.OAuth(
            "https://twitter.com/oauth/request_token",
            "https://twitter.com/oauth/access_token",
            consumerKey, consumerSecret, "1.0A", redirectURL + '?state=' + state, "HMAC-SHA1"
        );
    }
}
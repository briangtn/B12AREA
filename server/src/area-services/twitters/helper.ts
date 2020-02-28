import {Context} from '@loopback/context';
import * as oauth from 'oauth';
import {ActionRepository, UserRepository} from '../../repositories';
import request from 'request';
import NewDMActionController from './actions/on_new_dm/controller';
import NewMentionActionController, {NewMentionTwitter} from './actions/on_mention/controller';
import NewTweetActionController, {NewTweet} from './actions/on_tweet/controller';

const CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY ? process.env.TWITTER_CONSUMER_KEY :  "";
const CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET ? process.env.TWITTER_CONSUMER_SECRET :  "";
const WEBHOOK_URL = process.env.API_URL + '/services/twitters/webhook';

async function onTweet(twitterDatas: object, actionID: string, options: object, userID: string, ctx: Context) {
    if ('user_has_blocked' in twitterDatas) {
        await NewMentionActionController.trigger(twitterDatas as NewMentionTwitter, actionID, options, userID, ctx);
    } else {
        await NewTweetActionController.trigger(twitterDatas as NewTweet, actionID, options, userID, ctx);
    }
}

export interface TwitterUser {
    id: number,
    id_str: string,
    name: string,
    screen_name: string
}

export interface TwitterPlace {
    url: string,
    place_type: string,
    name: string,
    full_name: string,
    country_code: string,
    country: string
}

export interface Tweet {
    created_at: string,
    id_str: string,
    text: string,
    source: string,
    user: TwitterUser,
    place: TwitterPlace
}

interface EventSetting {
    trigger: ((twitterDatas: object, actionID: string, options: object, userID: string, ctx: Context) => void),
    actionName: string
}

const ACTION_EVENTS = {
    // eslint-disable-next-line @typescript-eslint/camelcase
    direct_message_events: {trigger: NewDMActionController.trigger, actionName: 'on_new_dm'},
    // eslint-disable-next-line @typescript-eslint/camelcase
    tweet_create_events: [
        {trigger: onTweet, actionName: 'on_mention'},
        {trigger: onTweet, actionName: 'on_tweet'}
    ]
}

export class TwitterHelper {
    static getTwitter(state = "") {
        const baseApiURl = process.env.API_URL;
        const redirectURL = baseApiURl + '/services/twitters/auth';

        return new oauth.OAuth(
            "https://twitter.com/oauth/request_token",
            "https://twitter.com/oauth/access_token",
            CONSUMER_KEY, CONSUMER_SECRET, "1.0A", redirectURL + '?state=' + state, "HMAC-SHA1"
        );
    }

    static async getOauthObject(userID: string, ctx: Context) {
        const userRepository: UserRepository = await ctx.get('repositories.UserRepository');
        let option: {accessToken: string, accessTokenSecret: string} | undefined;

        try {
            option = await userRepository.getServiceInformation(userID, 'twitters') as {accessToken: string, accessTokenSecret: string};
        } catch (e) {
            return null;
        }
        if (!option)
            return null;
        return {
            // eslint-disable-next-line @typescript-eslint/camelcase
            consumer_key: CONSUMER_KEY,
            // eslint-disable-next-line @typescript-eslint/camelcase
            consumer_secret: CONSUMER_SECRET,
            token: option.accessToken,
            // eslint-disable-next-line @typescript-eslint/camelcase
            token_secret: option.accessTokenSecret
        }
    }

    static createWebhook(ctx: Context) {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises,no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            request.post({
                url: 'https://api.twitter.com/1.1/account_activity/all/develop/webhooks.json',
                oauth: {
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    consumer_key: CONSUMER_KEY,
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    consumer_secret: CONSUMER_SECRET
                },
                headers: {
                    'Content-type': 'application/x-www-form-urlencoded'
                },
                form: {
                    url: WEBHOOK_URL
                }
            }, (err, res, body) => {
                if (err)
                    return reject(err);
                return resolve(body);
            });
        })
    }

    static createWebhookFromTwitterClient(token: string, tokenSecret: string) {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises,no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            request.post({
                url: 'https://api.twitter.com/1.1/account_activity/all/develop/webhooks.json',
                oauth: {
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    consumer_key: CONSUMER_KEY,
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    consumer_secret: CONSUMER_SECRET,
                    token,
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    token_secret: tokenSecret
                },
                headers: {
                    'Content-type': 'application/x-www-form-urlencoded'
                },
                form: {
                    url: WEBHOOK_URL
                }
            }, (err, res, body) => {
                if (err)
                    return reject(err);
                return resolve(body);
            });
        })
    }

    static getCurrentWebhook(ctx: Context) {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises,no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            request.get({
                url: 'https://api.twitter.com/1.1/account_activity/all/develop/webhooks.json',
                oauth: {
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    consumer_key: CONSUMER_KEY,
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    consumer_secret: CONSUMER_SECRET
                }
            }, (err, data, body) => {
                if (err)
                    return reject(err);
                const bodyParsed = JSON.parse(body);
                if (bodyParsed.length === 0)
                    return resolve(null);
                return resolve(bodyParsed[0]);
            })
        });
    }

    static deleteWebhook(webhookID: string, ctx: Context) {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises,no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            request.delete({
                url: 'https://api.twitter.com/1.1/account_activity/all/develop/webhooks/' + webhookID + '.json',
                oauth: {
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    consumer_key: CONSUMER_KEY,
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    consumer_secret: CONSUMER_SECRET
                }
            }, (err, data, body) => {
                if (err)
                    return reject(err);
                resolve(body);
            });
        });
    }

    static async refreshWebhook(webhookID: string, ctx: Context) {
        await this.deleteWebhook(webhookID, ctx);
        await this.createWebhook(ctx);
    }

    static subscribeWebhook(userID: string, ctx: Context) {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises,no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            const oauthObject = await this.getOauthObject(userID, ctx);

            if (!oauthObject)
                return reject({error: 'User not found'});
            request.post({
                url: 'https://api.twitter.com/1.1/account_activity/all/develop/subscriptions.json',
                oauth: oauthObject
            }, (e, r, b) => {
                if (e)
                    return reject(e);
                resolve(b);
            });
        })
    }

    static async unsubscribeWebhook(userID: string, ctx: Context) {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises,no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            const oauthObject = await this.getOauthObject(userID, ctx);

            if (!oauthObject)
                return;
            request.delete({
                url: 'https://api.twitter.com/1.1/account_activity/all/develop/subscriptions.json',
                oauth: oauthObject
            }, (err, res, body) => {
                if (err)
                    return reject(err);
                return resolve(body);
            });
        })
    }

    static getConsumerKeys() {
        return {
            consumerKey: CONSUMER_KEY,
            consumerSecret: CONSUMER_SECRET
        }
    }

    static getWebhookUrl() {
        return WEBHOOK_URL;
    }

    static getActionsEvents() {
        return ACTION_EVENTS;
    }

    static async triggerActionEvent(twitterData: object, userMail: string, userID: string, ctx: Context) {
        const validEvents = Object.keys(ACTION_EVENTS);

        for (const eventName of validEvents) {
            if (eventName in twitterData) {
                const event = ACTION_EVENTS[eventName as keyof typeof ACTION_EVENTS];

                if (!Array.isArray(event)) {
                    return this.triggerAnAction(twitterData, event as EventSetting, userID, userMail, ctx);
                }
                for (const oneEvent of event) {
                    this.triggerAnAction(twitterData, oneEvent as EventSetting, userID, userMail, ctx).then().catch((e) => {});
                }
            }
        }
    }

    static async triggerAnAction(twitterData: object, event: EventSetting, userID: string, userMail: string, ctx: Context) {
        const actionRepository: ActionRepository = await ctx.get('repositories.ActionRepository');

        const actions = await actionRepository.find({
            where: {
                serviceAction: `twitters.A.${event.actionName}`
            },
            include: [{
                relation: "area",
                scope: {
                    where: {
                        ownerId: userMail
                    }
                }
            }]
        });

        for (const action of actions) {
            return event.trigger(twitterData, action.id!, action.options!, userID, ctx);
        }
    }
}
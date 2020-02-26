import {TokensResponse} from "./interfaces";
import axios from "axios";
import {UserRepository} from "../../repositories";
import {Context} from "@loopback/context";
import ServiceController from "./controller";
import {google} from "googleapis";

export class YoutubeHelper {
    public static GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    public static GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

    public static isTokenValid(token: TokensResponse): Boolean {
        if (!token.expires_at)
            return false;
        if (new Date().valueOf() > token.expires_at)
            return false;
        return true;
    }

    public static getAuthUrl(redirectUrl: string) {
        const oauth2Client = new google.auth.OAuth2(
            this.GOOGLE_CLIENT_ID,
            this.GOOGLE_CLIENT_SECRET,
            redirectUrl
        );

        const scopes = [
            'https://www.googleapis.com/auth/youtube'
        ];

        return oauth2Client.generateAuthUrl({
            // 'online' (default) or 'offline' (gets refresh_token)
            // eslint-disable-next-line @typescript-eslint/camelcase
            access_type: 'offline',

            // If you only need one scope you can pass it as a string
            scope: scopes
        });
    }

    public static async getToken(code: string, redirectUri: string): Promise<any> {
        const oauth2Client = new google.auth.OAuth2(
            this.GOOGLE_CLIENT_ID,
            this.GOOGLE_CLIENT_SECRET,
            redirectUri
        );

        const {tokens} = await oauth2Client.getToken(code);
        console.log(tokens);
        return tokens;
    }
    public static async refreshToken(userId: string, ctx: Context): Promise<void> {
        const userRepository: UserRepository = await ctx.get('repositories.UserRepository');

        const oauth2Client = new google.auth.OAuth2(
            this.GOOGLE_CLIENT_ID,
            this.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({
            // eslint-disable-next-line @typescript-eslint/camelcase
            refresh_token: `STORED_REFRESH_TOKEN`
        });

        const token: TokensResponse = await userRepository.getServiceInformation(userId, ServiceController.serviceName) as TokensResponse;

        const response =  await axios.post('https://oauth2.googleapis.com/token', {
            // eslint-disable-next-line @typescript-eslint/camelcase
            client_id: YoutubeHelper.GOOGLE_CLIENT_ID,
            // eslint-disable-next-line @typescript-eslint/camelcase
            client_secret: YoutubeHelper.GOOGLE_CLIENT_SECRET,
            // eslint-disable-next-line @typescript-eslint/camelcase
            grant_type: 'refresh_token',
            // eslint-disable-next-line @typescript-eslint/camelcase
            access_type: 'offline',
            // eslint-disable-next-line @typescript-eslint/camelcase
            refresh_token: token.access_token
        });
        await YoutubeHelper.updateToken(userId, (response.data) as TokensResponse, ctx);
    }

    public static async updateToken(userId: string, token: TokensResponse, ctx: Context) {
        const userRepository: UserRepository = await ctx.get('repositories.UserRepository');

        await userRepository.addService(userId, {
            ...token,
            ...{
                expiresAt: new Date().valueOf() + token.expires_in,
            }
        }, ServiceController.serviceName);
    }
}
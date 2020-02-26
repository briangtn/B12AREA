import {TokensResponse} from "./interfaces";
import axios from "axios";
import {UserRepository} from "../../repositories";
import {Context} from "@loopback/context";
import ServiceController from "./controller";
import {google} from "googleapis";

export class YoutubeHelper {
    public static GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    public static GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    public static YOUTUBE_API_KEY : string = process.env.YOUTUBE_API_KEY ?? "";

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

    public static getAuthClient() {
        return new google.auth.OAuth2(
            YoutubeHelper.GOOGLE_CLIENT_ID,
            YoutubeHelper.GOOGLE_CLIENT_SECRET,
            YoutubeHelper.YOUTUBE_API_KEY
        );
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
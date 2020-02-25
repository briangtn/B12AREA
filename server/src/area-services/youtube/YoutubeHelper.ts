import {TokensResponse} from "./interfaces";
import axios from "axios";
import {UserRepository} from "../../repositories";
import {Context} from "@loopback/context";
import ServiceController from "./controller";

export class YoutubeHelper {
    public static GOOGLE_AUTHORIZE_BASE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
    public static GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    public static GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

    public static isTokenValid(token: TokensResponse): Boolean {
        if (!token.expires_at)
            return false;
        if (new Date().valueOf() > token.expires_at)
            return false;
        return true;
    }

    public static async refreshToken(userId: string, ctx: Context): Promise<void> {
        const userRepository: UserRepository = await ctx.get('repositories.UserRepository');

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
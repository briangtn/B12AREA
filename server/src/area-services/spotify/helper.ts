import {Context} from '@loopback/context'
import {AreaService} from '../../services';
import {UserRepository, ActionRepository} from '../../repositories';
import {ActionFunction, PullingData} from '../../services-interfaces';
import {User} from '../../models';
import * as qs from 'querystring'
import axios from 'axios';
import base64 from 'base-64';

export class SpotifyException {
    constructor(error: string, info: object = {}) {
        this.error = error;
        this.info = info;
    }
    error: string;
    info: object;
}

interface SpotifyExternalUrl {
    spotify: string
}

interface SpotifyArtist {
    external_urls: SpotifyExternalUrl
    href: string,
    id: string,
    name: string,
    type: string,
    uri: string
}

interface SpotifyTrack {
    id: string,
    name: string,
    explicit: boolean,
    duration_ms: number,
    artists: SpotifyArtist[],
    uri: string,
}

interface SpotifyUser {
    display_name: string,
    external_urls: SpotifyExternalUrl,
    href: string,
    id: string,
    type: string,
    uri: string
}

export interface SpotifyPlaylistTrack {
    added_at: string,
    added_by: SpotifyUser
    is_local: boolean,
    track: SpotifyTrack,
}

export interface AreaSpotifyTrack {
    name: string,
    explicit: boolean,
    duration: number,
    artistName: string,
    artistId: string,
    artistUrl: string,
    addedAt: string,
    addedById?: string,
    id: string,
    uri: string
}

export const SPOTIFY_NEW_PLAYLIST_SONG_PULLING_PREFIX = "spotify_newPlaylistSong_";
export const SPOTIFY_NEW_LIKED_SONG_PULLING_PREFIX = "spotify_newLikedSong_";
const SPOTIFY_TOKEN_EXCHANGE_BASE_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? "";
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? "";

export class SpotifyHelper {

    static async refreshSpotifyUser(user: User, ctx: Context) {
        return new Promise<void>((resolveMain) => {
            new Promise<{spotify?: {token: string, expiresAt: number, refreshToken: string}}>((resolve, reject) => {
                const services: {spotify?: {
                        token: string,
                        expiresAt: number,
                        refreshToken: string
                    }} = user.services!;
                const spotifyKey = "spotify" as keyof typeof user.services;

                if (services?.spotify) {
                    if (services.spotify.expiresAt >= new Date().valueOf() && user.services && user.services[spotifyKey]) {
                        delete user.services[spotifyKey];
                        return resolve(services);
                    } else if (services.spotify.expiresAt < new Date().valueOf() && user.services && user.services[spotifyKey]) {
                        axios.post(SPOTIFY_TOKEN_EXCHANGE_BASE_URL, qs.stringify({
                            // eslint-disable-next-line @typescript-eslint/camelcase
                            refresh_token: services.spotify.refreshToken,
                            // eslint-disable-next-line @typescript-eslint/camelcase
                            grant_type: 'refresh_token'
                        }), {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                Authorization: 'Basic ' + base64.encode(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET)
                            }
                        }).then((tokens: {data: {access_token: string, scope: string, token_type: string, expires_in: number}}) => {
                            if (services.spotify) {
                                services.spotify.expiresAt = new Date().valueOf() + tokens.data.expires_in;
                                services.spotify.token = tokens.data.access_token;
                            }
                            return resolve(services);
                        }).catch((err) => {
                            return resolve(services);
                        });
                    } else {
                        return resolve(services);
                    }
                }
            }).then(async (services) => {
                const userRepository: UserRepository = await ctx.get('repositories.UserRepository');

                user.services = services;
                await userRepository.update(user);
                resolveMain();
            }).catch(() => {})
        })

    }

    public static async getNewPlaylistSongPullingData(actionID: string, userID: string, ctx: Context): Promise<PullingData> {
        const userRepository: UserRepository = await ctx.get('repositories.UserRepository');
        const actionRepository: ActionRepository = await ctx.get('repositories.ActionRepository');

        const serviceData: {token: string} = await userRepository.getServiceInformation(userID, 'spotify') as {token: string};
        const options: {id: string} = (await actionRepository.getActionSettings(actionID))! as {id: string};

        if (!serviceData || !serviceData.token)
            throw new SpotifyException('Failed to retrieve tokens');
        return {
            url: `https://api.spotify.com/v1/playlists/${options.id}/tracks`,
            params: {headers: {Authorization: 'Bearer ' + serviceData.token}},
            diffFunction: async (data: {items: SpotifyPlaylistTrack[]}) => {
                const tracks = data.items;
                const diff = [];
                const actionData = (await actionRepository.getActionData(actionID))! as {lastDate: string};

                for (const track of tracks) {
                    if (new Date(track.added_at) > new Date(actionData.lastDate)) {
                        diff.push(this.parseSpotifyTrack(track));
                    }
                }
                return diff;
            },
            onDiff: async (tracks: AreaSpotifyTrack[]) => {
                await actionRepository.setActionData(actionID, {lastDate: new Date().toISOString()});

                for (const track of tracks) {
                    await ActionFunction({
                        actionId: actionID,
                        placeholders: [
                            {
                                name: 'SpotifyTrackName',
                                value: track.name
                            },
                            {
                                name: 'SpotifyTrackExplicit',
                                value: track.explicit ? 'explicit' : ''
                            },
                            {
                                name: 'SpotifyTrackDuration',
                                value: track.duration.toString()
                            },
                            {
                                name: 'SpotifyTrackArtistName',
                                value: track.artistName
                            },
                            {
                                name: 'SpotifyTrackArtistId',
                                value: track.artistId
                            },
                            {
                                name: 'SpotifyTrackArtistUrl',
                                value: track.artistUrl
                            },
                            {
                                name: 'SpotifyTrackAddedAt',
                                value: track.addedAt
                            },
                            {
                                name: 'SpotifyTrackAddedById',
                                value: track.addedById ?? ''
                            },
                            {
                                name: 'SpotifyTrackId',
                                value: track.id
                            },
                            {
                                name: 'SpotifyTrackUri',
                                value: track.uri
                            }
                        ]
                    }, ctx)
                }
            }
        };
    }

    public static async getNewLikedSongPullingData(actionID: string, userID: string, ctx: Context): Promise<PullingData> {
        const userRepository: UserRepository = await ctx.get('repositories.UserRepository');
        const actionRepository: ActionRepository = await ctx.get('repositories.ActionRepository');

        const serviceData: {token: string} = await userRepository.getServiceInformation(userID, 'spotify') as {token: string};

        if (!serviceData || !serviceData.token)
            throw new SpotifyException('Failed to retrieve tokens');
        return {
            url: `https://api.spotify.com/v1/me/tracks`,
            params: {headers: {Authorization: 'Bearer ' + serviceData.token}},
            diffFunction: async (data: {items: SpotifyPlaylistTrack[]}) => {
                const tracks = data.items;
                const diff = [];
                const actionData = (await actionRepository.getActionData(actionID))! as {lastDate: string};

                for (const track of tracks) {
                    if (new Date(track.added_at) > new Date(actionData.lastDate)) {
                        diff.push(this.parseSpotifyTrack(track));
                    }
                }
                return diff;
            },
            onDiff: async (tracks: AreaSpotifyTrack[]) => {
                await actionRepository.setActionData(actionID, {lastDate: new Date().toISOString()});

                for (const track of tracks) {
                    await ActionFunction({
                        actionId: actionID,
                        placeholders: [
                            {
                                name: 'SpotifyTrackName',
                                value: track.name
                            },
                            {
                                name: 'SpotifyTrackExplicit',
                                value: track.explicit ? 'explicit' : ''
                            },
                            {
                                name: 'SpotifyTrackDuration',
                                value: track.duration.toString()
                            },
                            {
                                name: 'SpotifyTrackArtistName',
                                value: track.artistName
                            },
                            {
                                name: 'SpotifyTrackArtistId',
                                value: track.artistId
                            },
                            {
                                name: 'SpotifyTrackArtistUrl',
                                value: track.artistUrl
                            },
                            {
                                name: 'SpotifyTrackAddedAt',
                                value: track.addedAt
                            },
                            {
                                name: 'SpotifyTrackId',
                                value: track.id
                            },
                            {
                                name: 'SpotifyTrackUri',
                                value: track.uri
                            }
                        ]
                    }, ctx)
                }
            }
        };
    }

    static async startNewPlaylistSongPulling(actionID: string, userID: string, ctx: Context) {
        const areaService: AreaService = await ctx.get('services.area');
        await areaService.startPulling(30, SPOTIFY_NEW_PLAYLIST_SONG_PULLING_PREFIX + actionID, 'spotify', ctx, {actionID, userID});
    }

    static async stopNewPlaylistSongPulling(actionID: string, ctx: Context) {
        const areaService: AreaService = await ctx.get('services.area');
        await areaService.stopPulling(SPOTIFY_NEW_PLAYLIST_SONG_PULLING_PREFIX + actionID, 'spotify', ctx);
    }

    static async startNewLikedSongPulling(actionID: string, userID: string, ctx: Context) {
        const areaService: AreaService = await ctx.get('services.area');
        await areaService.startPulling(30, SPOTIFY_NEW_LIKED_SONG_PULLING_PREFIX + actionID, 'spotify', ctx, {actionID, userID})
    }

    static async stopNewLikedSongPulling(actionID: string, ctx: Context) {
        const areaService: AreaService = await ctx.get('services.area');
        await areaService.stopPulling(SPOTIFY_NEW_LIKED_SONG_PULLING_PREFIX + actionID, 'spotify', ctx);
    }

    static parseSpotifyTrack(spotifyTrackVersion: SpotifyPlaylistTrack): AreaSpotifyTrack {
        return {
            name: spotifyTrackVersion.track.name,
            explicit: spotifyTrackVersion.track.explicit,
            duration: spotifyTrackVersion.track.duration_ms,
            artistName: spotifyTrackVersion.track.artists[0].name,
            addedAt: spotifyTrackVersion.added_at,
            artistId: spotifyTrackVersion.track.artists[0].id,
            artistUrl: spotifyTrackVersion.track.artists[0].uri,
            id: spotifyTrackVersion.track.id,
            uri: spotifyTrackVersion.track.uri
        }
    }

}
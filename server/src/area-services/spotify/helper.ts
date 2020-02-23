import {Context} from '@loopback/context'
import {AreaService} from '../../services';
import {UserRepository, ActionRepository} from '../../repositories';
import {ActionFunction} from '../../services-interfaces';
import {User} from '../../models';
import * as qs from 'querystring'
import axios from 'axios';
import base64 from 'base-64';

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
    name: string,
    explicit: boolean,
    duration_ms: number,
    artists: SpotifyArtist[],
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
    addedById: string,
}

const SPOTIFY_NEW_PLAYLIST_SONG_PULLING_PREFIX = "spotify_newPlaylistSong_";
const SPOTIFY_TOKEN_EXCHANGE_BASE_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? "";
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? "";

export class SpotifyHelper {

    static async refreshSpotifyUser(user: User, ctx: Context) {
        return new Promise((resolveMain) => {
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
                            // eslint-disable-next-line @typescript-eslint/camelcasec
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

    static async startNewPlaylistSongPulling(actionID: string, userID: string, ctx: Context) {
        const areaService: AreaService = await ctx.get('services.area');
        const userRepository: UserRepository = await ctx.get('repositories.UserRepository');
        const actionRepository: ActionRepository = await ctx.get('repositories.ActionRepository');

        const serviceData: {token: string} = await userRepository.getServiceInformation(userID, 'spotify') as {token: string};
        const options: {id: string} = (await actionRepository.getActionSettings(actionID))! as {id: string};

        areaService.startPulling(
            `https://api.spotify.com/v1/playlists/${options.id}/tracks`,
            {headers: {Authorization: 'Bearer ' + serviceData.token}},
            async (data: {items: SpotifyPlaylistTrack[]}) => {
                const tracks = data.items;
                const diff = [];
                const actionData = (await actionRepository.getActionData(actionID))! as {lastDate: string};

                for (const track of tracks) {
                    if (new Date(track.added_at) > new Date(actionData.lastDate)) {
                        diff.push(this.parseSpotifyTrack(track));
                    }
                }
                return diff;
            }, async (tracks: AreaSpotifyTrack[]) => {
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
                                value: track.addedById
                            }
                        ]
                    }, ctx)
                }

            }, 30, SPOTIFY_NEW_PLAYLIST_SONG_PULLING_PREFIX + actionID)
    }

    static async stopNewPlaylistSongPulling(actionID: string, ctx: Context) {
        const areaService: AreaService = await ctx.get('services.area');

        areaService.stopPulling(SPOTIFY_NEW_PLAYLIST_SONG_PULLING_PREFIX + actionID);
    }

    static parseSpotifyTrack(spotifyTrackVersion: SpotifyPlaylistTrack): AreaSpotifyTrack {
        return {
            name: spotifyTrackVersion.track.name,
            explicit: spotifyTrackVersion.track.explicit,
            duration: spotifyTrackVersion.track.duration_ms,
            artistName: spotifyTrackVersion.track.artists[0].name,
            addedAt: spotifyTrackVersion.added_at,
            addedById: spotifyTrackVersion.added_by.id,
            artistId: spotifyTrackVersion.track.artists[0].id,
            artistUrl: spotifyTrackVersion.track.artists[0].uri
        }
    }

}
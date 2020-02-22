import {Context} from '@loopback/context'
import {AreaService} from '../../services';
import {UserRepository, ActionRepository} from '../../repositories';
import {ActionFunction} from '../../services-interfaces';

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

export class SpotifyHelper {

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
                const actionData = (await actionRepository.getActionData(actionID))! as {lastDate: number};

                for (const track of tracks) {
                    if ((new Date(track.added_at)).valueOf() > actionData.lastDate) {
                        diff.push(this.parseSpotifyTrack(track));
                    }
                }
                return diff;
            }, async (tracks: AreaSpotifyTrack[]) => {
                await actionRepository.setActionData(actionID, {lastDate: new Date().valueOf()});

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

            }, 30, 'spotify_newPlaylistSong_' + actionID)
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
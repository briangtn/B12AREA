export interface TokensResponse {
    access_token: string,
    expires_in: number,
    scope: string,
    token_type: string,
    id_token: string
    refresh_token?: string,
    expires_at?: number
}

export interface NewVideoConfig {
    channel: string
}

export interface NewVideoData {
    webHookUrl: string
}

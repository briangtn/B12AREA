export interface GithubWebhookResponse {
    type: string;
    id: number;
    name: string;
    active: boolean;
    events: string[];
    config: object;
    updated_at: string;
    created_at: string;
    url: string;
    test_url: string;
    ping_url: string;
    last_response: object;
}

export interface GithubCommitBody {
    message: string;
    author: {
        name: string;
        email: string;
    }
}

export interface GithubPushHookBody {
    zen: string;
    ref: string;
    after: string;
    before: string;
    commits: GithubCommitBody[];
}

export interface GithubWebhookModel {
    id?: string;
    hookUuid?: string;
    userId?: string;
    owner?: string;
    repo?: string;
    type?: string;
    githubId?: number;
    name?: string;
    active?: boolean;
    events?: string[];
    config?: object;
    updatedAt?: string;
    createdAt?: string;
    url?: string;
    testUrl?: string;
    pingUrl?: string;
    lastResponse?: object;
}

export interface GithubTokenModel {
    token: string;
    userId: string;
}
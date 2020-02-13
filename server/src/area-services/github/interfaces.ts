
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
    sha: string;
    message: string;
    author: {
        name: string;
        email: string;
    }
    url: string;
    distinct: boolean;
}

export interface GithubPushHookBody {
    zen: string;
    ref: string;
    head: string;
    before: string;
    size: number;
    distinct_size: number;
    commits: GithubCommitBody[];
}
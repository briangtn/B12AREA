export interface TeamsAPIUserResource {
    displayName: string;
    mail: string;
    id: string;
}

export interface TeamsAPIIdentityResource {
    displayName: string;
    id: string;
    tenantId?: string;
}

export interface TeamsAPIIdentitySetResource {
    application?: TeamsAPIIdentityResource;
    conversation?: TeamsAPIIdentityResource;
    conversationIdentityType?: TeamsAPIIdentityResource;
    device?: TeamsAPIIdentityResource;
    phone?: TeamsAPIIdentityResource;
    user?: TeamsAPIIdentityResource;
}

export interface TeamsAPIItemBodyResource {
    content: string;
    contentType: string;
}

export interface TeamsAPIChatMessageAttachment {
    id: string;
    contentType: string;
    contentUrl?: string;
    content?: string;
    name: string;
    thumbnailUrl?: string;
}

export interface TeamsAPIChatMessageMention {
    id: number;
    mentionText: string;
    mentioned: TeamsAPIIdentitySetResource;
}

export interface TeamsAPIChatMessageReaction {
    createdDateTime: string;
    reactionType: string;
    user: TeamsAPIIdentitySetResource;
}

export interface TeamsAPIChatMessageResource {
    id: string;
    replyToId?: string;
    from: TeamsAPIIdentitySetResource;
    etag: string;
    messageType: string;
    createdDateTime: string;
    lastModifiedDateTime?: string;
    deletedDateTime?: string;
    subject?: string;
    body: TeamsAPIItemBodyResource;
    summary?: string;
    attachments: TeamsAPIChatMessageAttachment[];
    mentions: TeamsAPIChatMessageMention[];
    importance: string;
    reactions: TeamsAPIChatMessageReaction[];
    locale: string;
}
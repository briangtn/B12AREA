export interface IPlaceHolder {
    name: string,
    description: string
}

export interface IConfigSchema {
    description: string,
    name: string,
    required: boolean,
    type: string
}

export interface IAction {
    name: string,
    displayName: string,
    description: string,
    placeholders: IPlaceHolder[],
    configSchema: IConfigSchema[]
}

export interface IReaction {
    name: string,
    displayName: string,
    description: string,
    configSchema: IConfigSchema[]
}

export interface IService {
    name: string,
    description: string,
    color: string,
    icon: string,
    actions: IAction[],
    reactions: IReaction[]
}

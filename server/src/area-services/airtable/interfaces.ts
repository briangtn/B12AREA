export interface ApiKey {
    apiKey: string
}

export interface BaseID {
    baseId: string
}

export interface TableID {
    tableId: string
}

export interface BaseConfig extends ApiKey, BaseID {}

export interface NewEntryConfig extends BaseConfig, TableID {
    data: string
}

export interface NewEntryParsed extends BaseConfig, TableID {
    entryToCreate: Object
}
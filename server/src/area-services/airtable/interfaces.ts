export interface ApiKey {
    apiKey: string
}

export interface BaseID {
    baseId: string
}

export interface TableID {
    tableId: string
}

export interface BaseConfig extends ApiKey, BaseID, TableID {}

export interface NewEntryConfig extends BaseConfig {
    data: string
}

export interface NewEntryParsed extends BaseConfig {
    entryToCreate: Object
}

export interface Record {
    id: string,
    fields: Object
}
import {getModelSchemaRef} from "@loopback/rest";
import {Action, Area, Reaction} from "../../models";

export const NewArea = {
    content: {
        'application/json': {
            schema: getModelSchemaRef(Area, {
                title: 'NewArea',
                exclude: ['id', 'ownerId'],
                optional: ['action', 'reactions', 'enabled']
            }),
        },
    },
};

export const PatchArea = {
    content: {
        'application/json': {
            schema: getModelSchemaRef(Area, {partial: true}),
        },
    },
};

export const NewActionInArea = {
    content: {
        'application/json': {
            schema: getModelSchemaRef(Action, {
                title: 'NewActionInArea',
                exclude: ['id'],
                optional: ['areaId']
            }),
        },
    },
};

export const NewReactionInArea = {
    content: {
        'application/json': {
            schema: getModelSchemaRef(Reaction, {
                title: 'NewReactionInArea',
                exclude: ['id'],
                optional: ['areaId']
            }),
        },
    },
};
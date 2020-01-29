import {getModelSchemaRef} from "@loopback/rest";
import {Action, Area} from "../../models";

export const NewArea = {
    content: {
        'application/json': {
            schema: getModelSchemaRef(Area, {
                title: 'NewArea',
                exclude: ['id', 'ownerId'],
                optional: ['action', 'reactions']
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
}
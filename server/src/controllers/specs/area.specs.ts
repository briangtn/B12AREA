import {getModelSchemaRef} from "@loopback/rest";
import {Area} from "../../models";

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
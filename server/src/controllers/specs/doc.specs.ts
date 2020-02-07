export const response200 = function(model: Object, description: string) {
    return response200Schema({
        'x-ts-type': model
    }, description);
};

export const response200Schema = function(schema: Object, description: string) {
    return {
        description,
        content: {
            'application/json': {
                schema: schema
            }
        }
    }
};

export const response204 = function(description: string) {
    return {
        description: description,
    };
};

export const response400 = function(description = "Bad request") {
    return {
        description,
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'object',
                            properties: {
                                statusCode: {
                                    type: 'number',
                                    example: 400
                                },
                                name: {
                                    type: 'string',
                                    example: 'BadRequestError'
                                },
                                message: {
                                    type: 'string'
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

export const response401 = function(description = "Unauthorized") {
    return {
        description,
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'object',
                            properties: {
                                statusCode: {
                                    type: 'number',
                                    example: 401
                                },
                                name: {
                                    type: 'string',
                                    example: 'UnauthorizedError'
                                },
                                message: {
                                    type: 'string'
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

export const response409 = function(description: string, exampleMessage = "Email already in use") {
    return {
        description,
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'object',
                            properties: {
                                statusCode: {
                                    type: 'number',
                                    example: 409
                                },
                                name: {
                                    type: 'string',
                                    example: 'ConflictError'
                                },
                                message: {
                                    type: 'string',
                                    example: exampleMessage
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

export const response404 = function(description = 'Not found') {
    return {
        description,
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'object',
                            properties: {
                                statusCode: {
                                    type: 'number',
                                    example: 404
                                },
                                name: {
                                    type: 'string',
                                    example: 'NotFoundError'
                                },
                                message: {
                                    type: 'string',
                                    example: description
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

export const response422 = function(description = 'Invalid params', exampleMessage = 'Invalid entity') {
    return {
        description,
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'object',
                            properties: {
                                statusCode: {
                                    type: 'number',
                                    example: 422
                                },
                                name: {
                                    type: 'string',
                                    example: 'UnprocessableEntityError'
                                },
                                message: {
                                    type: 'string',
                                    example: 'The request body is invalid. See error object `details` property for more info.'
                                },
                                details: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            message: {
                                                type: 'string',
                                                example: exampleMessage
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};
